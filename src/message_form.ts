/*******************************************************************/
/**
 * Imports
 */
import * as path from "path";
import {Uri, ViewColumn, WebviewPanel, window} from "vscode";
import Store from './store';

let panel: WebviewPanel;

/*******************************************************************/
async function commit_message_form(store: Store, file?: string): Promise<string | undefined> {
    const promise = new Promise<string | undefined>(resolve => {
        let message = store.getLastComment();

        // Close previous commit message input
        if (panel) {
            panel.dispose();
        }

        panel = window.createWebviewPanel("cvsCommitMessage", "Commit Message", {
            preserveFocus: false,
            viewColumn: ViewColumn.Active
        },
        {
            enableScripts: true,
            retainContextWhenHidden: true
        });

        const stylePathOnDisk = Uri.file(path.join(__dirname, "..", "css", "commit-message.css"));
        const styleUri = panel.webview.asWebviewUri(stylePathOnDisk);
        const beforeForm = `
<div class="file-list">
    <h3 class="title">Opened file to commit:</h3>
    <ul>
        ${file}
    </ul>
</div>`;

    const html = `<!DOCTYPE html>
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

    <title>Commit Message</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <section class="container">
        ${beforeForm}
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

        // load current message
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

        // Allow CTRL + Enter
        txtMessage.addEventListener("keydown", function(e) {
            if (event.ctrlKey && event.keyCode === 13) {
                btnCommit.click();
            }
        });

        // Auto resize the height of message
        txtMessage.addEventListener("input", function(e) {
            txtMessage.style.height = "auto";
            txtMessage.style.height = (txtMessage.scrollHeight) + "px";
        });

        window.addEventListener("load", function() {
            setTimeout(() => {
                txtMessage.focus();
            }, 1000);
        });

        // Message from VSCode
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
</html>`;

        panel.webview.html = html;

        // On close
        panel.onDidDispose(() => {
            resolve(undefined);
        });

        // On button click
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case "commit":
                    resolve(message.message);
                    panel.dispose();
                    break;
                default:
                    resolve(undefined);
                    panel.dispose();
            }
        });

        // Force show and activate
        panel.reveal(ViewColumn.Active, false);

    });

    return promise;
}

/*******************************************************************/
async function commit_content_message_form(store: Store, files: string[]): Promise<string | undefined> {
    const promise = new Promise<string | undefined>(resolve => {
        let message = store.getLastComment();

        // Close previous commit message input
        if (panel) {
            panel.dispose();
        }

        panel = window.createWebviewPanel("cvsCommitMessage", "Commit Message", {
            preserveFocus: false,
            viewColumn: ViewColumn.Active
        },
        {
            enableScripts: true,
            retainContextWhenHidden: true
        });

        const stylePathOnDisk = Uri.file(path.join(__dirname, "..", "css", "commit-message.css"));
        const styleUri = panel.webview.asWebviewUri(stylePathOnDisk);

        let beforeForm = "";
        if (files && files.length) {
            const changedFiles = files.sort().map(f => `<li>${f}</li>`);
            if (changedFiles.length) {
                beforeForm = `
<div class="file-list">
    <h3 class="title">Files and directories to commit:</h3>
    <ul>
        ${changedFiles.join("\n")}
    </ul>
</div>`;
            }
        }

        const html = `<!DOCTYPE html>
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

    <title>Commit Message</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <section class="container">
        ${beforeForm}
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

        // load current message
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

        // Allow CTRL + Enter
        txtMessage.addEventListener("keydown", function(e) {
            if (event.ctrlKey && event.keyCode === 13) {
                btnCommit.click();
            }
        });

        // Auto resize the height of message
        txtMessage.addEventListener("input", function(e) {
            txtMessage.style.height = "auto";
            txtMessage.style.height = (txtMessage.scrollHeight) + "px";
        });

        window.addEventListener("load", function() {
            setTimeout(() => {
                txtMessage.focus();
            }, 1000);
        });

        // Message from VSCode
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
</html>`;

        panel.webview.html = html;

        // On close
        panel.onDidDispose(() => {
            resolve(undefined);
        });

        // On button click
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case "commit":
                    resolve(message.message);
                    panel.dispose();
                    break;
                default:
                    resolve(undefined);
                    panel.dispose();
            }
        });

        // Force show and activate
        panel.reveal(ViewColumn.Active, false);

    });

    return promise;
}

/*******************************************************************/
/**
 * Exports
 */
export {commit_message_form, commit_content_message_form};