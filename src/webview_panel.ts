////////////////////////////////////////////////////////////////////
/**
 * Imports
 */
import * as path from "path";
import {Uri, ViewColumn, WebviewPanel, window} from "vscode";

import ExtensionVDB from './vdb';
import {ExtensionChannel} from "./log";
import Utils from "./utils";
import {CompareFileWithLatestCleanCopy} from './compare';

let panel: WebviewPanel;

////////////////////////////////////////////////////////////////////
async function commit_panel(vdb: ExtensionVDB, file?: string): Promise<string | undefined> {
    const promise = new Promise<string | undefined>(resolve => {
        let message = vdb.getLastComment();

        if (panel) {
            panel.dispose();
        }

        panel = window.createWebviewPanel("CVSCommit", "Commit", {
            preserveFocus: false,
            viewColumn: ViewColumn.Active
        },
        {
            enableScripts: true,
            retainContextWhenHidden: true
        });

        const style = Uri.file(path.join(__dirname, "..", "css", "vscode-webview-panel-style.css"));
        const styleUri = panel.webview.asWebviewUri(style);
        const htmlBeforeForm = 
`
<div class="file-list">
    <h3 class="title">Opened file to commit:</h3>
    <ul>
        ${file}
    </ul>
</div>
`;

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!--
    Use a content security policy to only allow loading images from https or from our extension directory,
    and only allow scripts that have a specific nonce.
    -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${
        panel.webview.cspSource
    } https:; script-src ${panel.webview.cspSource} 'unsafe-inline'; style-src ${
        panel.webview.cspSource
    };">

    <title>Commit</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <section class="container">
        ${htmlBeforeForm}
        <form>
            <fieldset>
                <label for="message">Commit message</label>
                <textarea id="message" rows="3" placeholder="Message (press Ctrl+Enter to commit)"></textarea>
                <button id="commit" class="button-primary">Commit</button>
                <div class="float-right">
                    <button id="cancel" class="button button-outline">Cancel</button>
                </div>
            </fieldset>
        </form>
    </section>
    <script>
        const vscode = acquireVsCodeApi();

        const txtMessage = document.getElementById("message");
        const btnCommit = document.getElementById("commit");
        const btnCancel = document.getElementById("cancel");

        txtMessage.value = ${JSON.stringify(message)};

        btnCommit.addEventListener("click", function() {
            vscode.postMessage({
                command: "commit",
                message: txtMessage.value
            });
        });

        btnCancel.addEventListener("click", function() {
            vscode.postMessage({
                command: "cancel"
            });
        });

        txtMessage.addEventListener("keydown", function(e) {
            if (event.ctrlKey && event.keyCode === 13) {
                btnCommit.click();
            }
        });

        txtMessage.addEventListener("input", function(e) {
            txtMessage.style.height = "auto";
            txtMessage.style.height = (txtMessage.scrollHeight) + "px";
        });

        window.addEventListener("load", function() {
            setTimeout(() => {
                txtMessage.focus();
            }, 1000);
        });

        window.addEventListener("message", function(event) {
            const message = event.data;
            switch (message.command) {
                case "setMessage":
                    txtMessage.value = message.message;
                    txtMessage.dispatchEvent(new Event("input"));
                    break;
            }
        });
    </script>
</body>
</html>
`;

        panel.webview.html = html;

        panel.onDidDispose(() => {
            resolve(undefined);
        });

        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case "commit": {
                    resolve(message.message);
                    panel.dispose();
                    break;
                }
                default: {
                    resolve(undefined);
                    panel.dispose();
                }
            }
        });

        panel.reveal(ViewColumn.Active, false);
    });

    return promise;
}

////////////////////////////////////////////////////////////////////
async function commit_content_panel(
    vdb: ExtensionVDB, 
    logger: ExtensionChannel,
    cvs_root: string, 
    work_dir: string, 
    modified_files: string[], 
    added_files: string[], 
    removed_files: string[]
): Promise<[string, string[]] | undefined> 
{
    const promise = new Promise<[string, string[]] | undefined>(resolve => {
        let message = vdb.getLastComment();

        if (panel) {
            panel.dispose();
        }

        panel = window.createWebviewPanel("CVSCommitContent", "Commit ...", {
            preserveFocus: false,
            viewColumn: ViewColumn.Active
        },
        {
            enableScripts: true,
            retainContextWhenHidden: true
        });

        const style = Uri.file(path.join(__dirname, "..", "css", "vscode-webview-panel-style.css"));
        const styleUri = panel.webview.asWebviewUri(style);

        let modified = '';
        if (modified_files.length) {
            modified = 
`
<h3 class="title">Modified:</h3>
<ul>
    <fieldset>
`;

            for (const file of modified_files) {
                modified += 
`
    <div class="checkbox">
        <label>
            <input type="hidden" name="${file}" value="">
            <input required="required" class="${file}" id="${file}" type="checkbox" name="${file}" value="value" checked>${file}
        </label>
    </div>
`;
            }

            modified += 
`
    </fieldset>
</ul>
`;
        }

        let added = '';
        if (added_files.length) {
            added = 
`
<h3 class="title">Added:</h3>
<ul>
    <fieldset>
`;

            for (const file of added_files) {
                added += 
`
    <div class="checkbox">
        <label>
            <input type="hidden" name="${file}" value="">
            <input required="required" class="${file}" id="${file}" type="checkbox" name="${file}" value="value" checked>${file}
        </label>
    </div>
`;
            }

            added += 
`
    </fieldset>
</ul>
`;
        }

        let removed = '';
        if (removed_files.length) {
            removed = 
`
<h3 class="title">Removed:</h3>
<ul>
    <fieldset>
`;

            for (const file of removed_files) {
                removed += 
`
    <div class="checkbox">
        <label>
            <input type="hidden" name="${file}" value="">
            <input required="required" class="${file}" id="${file}" type="checkbox" name="${file}" value="value" checked>${file}
        </label>
    </div>
`;
            }

            removed += 
`
    </fieldset>
</ul>`;
        }

        const htmlBeforeForm = modified + added + removed;
        const html = 
`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!--
    Use a content security policy to only allow loading images from https or from our extension directory,
    and only allow scripts that have a specific nonce.
    -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${
        panel.webview.cspSource
    } https:; script-src ${panel.webview.cspSource} 'unsafe-inline'; style-src ${
        panel.webview.cspSource
    };">

    <title>Commit ...</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <section class="container">
        ${htmlBeforeForm}
        <form>
            <fieldset>
                <div class="float-right">
                    <a href="#" id="compare">Compare modified files</a>
                </div>
                <label for="message">Commit message</label>
                <textarea id="message" rows="3" placeholder="Message (press Ctrl+Enter to commit)"></textarea>
                <button id="commit" class="button-primary">Commit</button>
                <div class="float-right">
                    <button id="cancel" class="button button-outline">Cancel</button>
                </div>
            </fieldset>
        </form>
    </section>
    <script>
        var files = [];
        const vscode = acquireVsCodeApi();

        const txtMessage = document.getElementById("message");
        const btnCommit = document.getElementById("commit");
        const btnCancel = document.getElementById("cancel");
        const btnCompare = document.getElementById("compare");

        txtMessage.value = ${JSON.stringify(message)};

        btnCommit.addEventListener("click", function() {
            var filesToCommit = [];
            for (var i in files) {
                const checkbox = document.getElementById(files[i]);
                if (checkbox.checked) 
                    filesToCommit.push(files[i]);
            }

            vscode.postMessage({
                command: "commit",
                message: txtMessage.value,
                text: filesToCommit
            });
        });

        btnCancel.addEventListener("click", function() {
            vscode.postMessage({
                command: "cancel"
            });
        });

        txtMessage.addEventListener("keydown", function(e) {
            if (event.ctrlKey && event.keyCode === 13) {
                btnCommit.click();
            }
        });

        txtMessage.addEventListener("input", function(e) {
            txtMessage.style.height = "auto";
            txtMessage.style.height = (txtMessage.scrollHeight) + "px";
        });

        window.addEventListener("load", function() {
            setTimeout(() => {
                txtMessage.focus();
            }, 1000);
        });

        btnCompare.addEventListener("click", function() {
            var filesToCompare = [];
            for (var i in files) {
                const checkbox = document.getElementById(files[i]);
                if (checkbox.checked) 
                    filesToCompare.push(files[i]);
            }

            vscode.postMessage({
              command: "compare",
              message: filesToCompare
            });
        });

        window.addEventListener("message", function(event) {
            const message = event.data;
            switch (message.command) {
                case "sendFiles":
                    files = message.message;
                    break;
            }
        });
    </script>
</body>
</html>`;

        panel.webview.html = html;

        panel.onDidDispose(() => {
            resolve(undefined);
        });

        const compare = async (filesToCompare: string[]) => {
            for (const file of modified_files) {
                if (filesToCompare.includes(file)) {
	                let cvs = new CompareFileWithLatestCleanCopy(
                        cvs_root as string, 
                        work_dir as string, 
                        file, 
                        work_dir + path.sep + file
                    );

                    await cvs.compare(vdb, logger);
                }
            }
        };

        panel.webview.postMessage({
            command: "sendFiles",
            message: [...modified_files, ...added_files, ...removed_files]
        });

        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case "commit": {
                    resolve([message.message, message.text]);
                    panel.dispose();
                    break;
                }
                case "compare": {
                    compare(message.message);
                    break;
                }
                default: {
                    resolve(undefined);
                    panel.dispose();
                }
            }
        });

        panel.reveal(ViewColumn.Active, false);

    });

    return promise;
}

////////////////////////////////////////////////////////////////////
async function add_content_panel(uncontrolled_files: string[]): Promise<string[] | undefined> {
    const promise = new Promise<string[] | undefined>(resolve => {
        if (panel) {
            panel.dispose();
        }

        panel = window.createWebviewPanel("CVSAddContent", "Add ...", {
            preserveFocus: false,
            viewColumn: ViewColumn.Active
        },
        {
            enableScripts: true,
            retainContextWhenHidden: true
        });

        const style = Uri.file(path.join(__dirname, "..", "css", "vscode-webview-panel-style.css"));
        const styleUri = panel.webview.asWebviewUri(style);

        let uncontrolled = '';
        if (uncontrolled_files.length) {
            uncontrolled = 
`
<h3 class="title">Uncontrolled:</h3>
`;
            if (Utils.Extension.is_add_as_binary()) {
                uncontrolled += 
`
<div class="float-right">
    <a class="title">NOTE: selected files will added as binary</a>
</div>
<ul>
    <fieldset>
`;
            }
            else {
                uncontrolled += 
`
<div class="float-right">
    <a class="title">NOTE: selected files will added as text</a>
</div>
<ul>
    <fieldset>
`;
            }
            for (const file of uncontrolled_files) {
                uncontrolled += 
`
    <div class="checkbox">
        <label>
            <input type="hidden" name="${file}" value="">
            <input required="required" class="${file}" id="${file}" type="checkbox" name="${file}" value="value">${file}
        </label>
    </div>
`;
            }

            uncontrolled += 
`
    </fieldset>
</ul>
`;
        }

        const htmlBeforeForm = uncontrolled;
        const html = 
`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!--
    Use a content security policy to only allow loading images from https or from our extension directory,
    and only allow scripts that have a specific nonce.
    -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${
        panel.webview.cspSource
    } https:; script-src ${panel.webview.cspSource} 'unsafe-inline'; style-src ${
        panel.webview.cspSource
    };">

    <title>Add ...</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <section class="container">
        ${htmlBeforeForm}
        <form>
            <fieldset>
                <button id="add" class="button-primary">Add</button>
                <div class="float-right">
                    <button id="cancel" class="button button-outline">Cancel</button>
                </div>
            </fieldset>
        </form>
    </section>
    <script>
        var files = [];
        const vscode = acquireVsCodeApi();

        const btnAdd = document.getElementById("add");
        const btnCancel = document.getElementById("cancel");

        btnAdd.addEventListener("click", function() {
            var filesToAdd = [];
            for (var i in files) {
                const checkbox = document.getElementById(files[i]);
                if (checkbox.checked) 
                    filesToAdd.push(files[i]);
            }

            vscode.postMessage({
                command: "add",
                message: filesToAdd
            });
        });

        btnCancel.addEventListener("click", function() {
            vscode.postMessage({
                command: "cancel"
            });
        });

        window.addEventListener("message", function(event) {
            const message = event.data;
            switch (message.command) {
                case "sendFiles":
                    files = message.message;
                    break;
            }
        });
    </script>
</body>
</html>
`;

        panel.webview.html = html;

        panel.onDidDispose(() => {
            resolve(undefined);
        });

        panel.webview.postMessage({
            command: "sendFiles",
            message: uncontrolled_files
        });

        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case "add": {
                    resolve(message.message);
                    panel.dispose();
                    break;
                }
                default: {
                    resolve(undefined);
                    panel.dispose();
                }
            }
        });

        panel.reveal(ViewColumn.Active, false);

    });

    return promise;
}

////////////////////////////////////////////////////////////////////
async function remove_content_panel(updated_files: string[]): Promise<string[] | undefined> 
{
    const promise = new Promise<string[] | undefined>(resolve => {
        if (panel) {
            panel.dispose();
        }

        panel = window.createWebviewPanel("CVSRemoveContent", "Remove ...", {
            preserveFocus: false,
            viewColumn: ViewColumn.Active
        },
        {
            enableScripts: true,
            retainContextWhenHidden: true
        });

        const style = Uri.file(path.join(__dirname, "..", "css", "vscode-webview-panel-style.css"));
        const styleUri = panel.webview.asWebviewUri(style);

        let updated = '';
        if (updated_files.length) {
            updated = 
`
<h3 class="title">Updated remotely:</h3>
<div class="float-right">
    <a class="title">NOTE: select files that you are want to remove from repository</a>
</div>
<ul>
    <fieldset>
`;

            for (const file of updated_files) {
                updated += 
`
    <div class="checkbox">
        <label>
            <input type="hidden" name="${file}" value="">
            <input required="required" class="${file}" id="${file}" type="checkbox" name="${file}" value="value">${file}
        </label>
    </div>
`;
            }

            updated += 
`
    </fieldset>
</ul>
`;
        }

        const htmlBeforeForm = updated;
        const html = 
`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!--
    Use a content security policy to only allow loading images from https or from our extension directory,
    and only allow scripts that have a specific nonce.
    -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${
        panel.webview.cspSource
    } https:; script-src ${panel.webview.cspSource} 'unsafe-inline'; style-src ${
        panel.webview.cspSource
    };">

    <title>Remove ...</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <section class="container">
        ${htmlBeforeForm}
        <form>
            <fieldset>
                <button id="remove" class="button-primary">Remove</button>
                <div class="float-right">
                    <button id="cancel" class="button button-outline">Cancel</button>
                </div>
            </fieldset>
        </form>
    </section>
    <script>
        var files = [];
        const vscode = acquireVsCodeApi();

        const btnRemove = document.getElementById("remove");
        const btnCancel = document.getElementById("cancel");

        btnRemove.addEventListener("click", function() {
            var filesToRemove = [];
            for (var i in files) {
                const checkbox = document.getElementById(files[i]);
                if (checkbox.checked) 
                    filesToRemove.push(files[i]);
            }

            vscode.postMessage({
                command: "remove",
                message: filesToRemove
            });
        });

        btnCancel.addEventListener("click", function() {
            vscode.postMessage({
                command: "cancel"
            });
        });

        window.addEventListener("message", function(event) {
            const message = event.data;
            switch (message.command) {
                case "sendFiles":
                    files = message.message;
                    break;
            }
        });
    </script>
</body>
</html>
`;

        panel.webview.html = html;

        panel.onDidDispose(() => {
            resolve(undefined);
        });

        panel.webview.postMessage({
            command: "sendFiles",
            message: updated_files
        });

        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case "remove": {
                    resolve(message.message);
                    panel.dispose();
                    break;
                }
                default: {
                    resolve(undefined);
                    panel.dispose();
                }
            }
        });

        panel.reveal(ViewColumn.Active, false);

    });

    return promise;
}

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export {commit_panel, commit_content_panel, add_content_panel, remove_content_panel};