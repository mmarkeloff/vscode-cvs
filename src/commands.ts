/*******************************************************************/
/**
 * Imports
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import {spawn} from 'child_process';
import Store from './store';
import Utils from './utils';
import * as commiter from './cvs_commit';
import * as adder from './cvs_add';
import * as shower from './cvs_show';
import * as checkouter from './cvs_checkout';
import * as comparator from './cvs_compare';
import * as updater from './cvs_update';
import * as message_form from './message_form';

/*******************************************************************/
/**
 * Commit opened file in current VS Code window to remote repository
 * @param fileUri Stores path of selected file/directory in VS Code explorer
 * @param store Stores some runtime info
 */
async function commit(fileUri: any, store: Store) {
    const cvsRoot = Utils.config.getCVSRoot();
    if (!cvsRoot) {
        return vscode.window.showErrorMessage('Unable to get vscode-cvs.CVSROOT variable');
    }

    const {activeTextEditor} = vscode.window;
    const opened = activeTextEditor && activeTextEditor.document.uri.fsPath;
    if (!opened) {
        return vscode.window.showErrorMessage('You cannot commit an unopened or unsaved file');
    }

    const workDir = Utils.folder.getRoot(opened);

    const comment = await message_form.commit_message_form(store, Utils.folder.getRelative(opened, workDir as string));
    if (comment !== undefined) {
        const file = Utils.folder.getRelative(opened, workDir as string);
        const msg = 
            comment === '' ? 
            `Are you sure want to commit opened file in current window: ${file} with empty comment?`
            :
            `Are you sure want to commit opened file in current window: ${file} with comment: ${comment}?`;

        const choice = await vscode.window.showWarningMessage(msg, { modal: true }, "Yes");

        if (choice === "Yes") {
            let cvs: commiter.ICommiter = new commiter.OpenedFileCommiter(
                cvsRoot as string, workDir as string, comment!, file);

            cvs.commit(store);
        }
    }
}

/*******************************************************************/
/**
 * Smart commit content of selected directory in VS Code explorer to remote repository
 * @param fileUri Stores path of selected directory in VS Code explorer
 * @param store Stores some runtime info
 */
async function commit_content(fileUri: any, store: Store) {
    const cvsRoot = Utils.config.getCVSRoot();
    if (!cvsRoot) {
        return vscode.window.showErrorMessage('Unable to get vscode-cvs.CVSROOT variable');
    }

    let changes: String = '';
    const workDir = Utils.folder.getSelected(fileUri);
    let proc = spawn(
        'cvs', 
        ['-d', cvsRoot as string, '-qn', 'update'], 
        {cwd: workDir})
        .on("close", async (code, signal) => {
            if (code) {
                vscode.window.showErrorMessage(
                    `Unable to get changes in local directory: ${workDir}`
                );
            }
            else {
                // Array of paths with prefix 'X '
                const files = changes.replace(/[\r\n]/g, '\n').split('\n');

                if (files && files.length && files[0] !== '') {
                    const comment = await message_form.commit_content_message_form(store, 
                        files.filter(element => element !== '')
                    );

                    if (comment !== undefined) {
                        const msg = comment === '' ? 
                            `Are you sure want to commit files from local directory: ${workDir} with empty comment?`
                            :
                            `Are you sure want to commit files from local directory: ${workDir} with comment: ${comment}?`;

                        const choice = await vscode.window.showWarningMessage(msg, { modal: true }, "Yes");
                        if (choice === "Yes") {
                            let cvs: commiter.ICommiter = new commiter.SelectedDirContentCommiter(
                                cvsRoot as string, workDir, comment!, files.filter(element => element !== ''));
            
                            cvs.commit(store);
                        }
                    }
                }
                else {
                    vscode.window.showInformationMessage(
                        `There is no changes in local directory: ${workDir}`, {modal: true});
                }
            }
        });

        proc.stdout
            .on("data", (chunk: string | Buffer) => {
                // Collect changes
                changes += chunk.toString();
            });

        proc.stderr
            .on("data", (chunk: string | Buffer) => {
                // Print stderr to OUTPUT tab
                store.printToLog(chunk as string);
            });
}

/*******************************************************************/
/**
 * Add selected object in VS Code explorer to remote repository
 * @param fileUri Stores path of selected file/directory in VS Code explorer
 * @param store Stores some runtime info
 */
async function add(fileUri: any, store: Store) {
    const cvsRoot = Utils.config.getCVSRoot();
    if (!cvsRoot) {
        return vscode.window.showErrorMessage('Unable to get vscode-cvs.CVSROOT variable');
    }

    const selected = Utils.folder.getSelected(fileUri);
    fs.lstat(selected, async (err, stat) => {
        if (err) {
            vscode.window.showErrorMessage(
                `Unable to check file or directory has been selected: ${selected}`
            );
        }
        else {
            const workDir = Utils.folder.getRoot();
            const obj = Utils.folder.getRelative(selected, workDir as string);
            let cvs: adder.IAdder | undefined = undefined

            // Selected object is file
            if (stat.isFile()) {
                vscode.window.showInformationMessage(`Select file type`);
                const choice = await vscode.window.showQuickPick(
                    ['text', 'binary'], 
                    {placeHolder: 'text or binary'}
                );

                if (choice === 'text') {
                    cvs = new adder.SelectedTextFileAdder(cvsRoot as string, workDir as string, obj);
                }
                else {
                    cvs = new adder.SelectedBinaryFileAdder(cvsRoot as string, workDir as string, obj);
                }
            } 
            // Selected object is directory
            else if (stat.isDirectory()) {
                cvs = new adder.SelectedDirAdder(cvsRoot as string, workDir as string, obj);
            }

            cvs!.add(store);
        }
    });
}

/*******************************************************************/
/**
 * Show changes in base path of selected directory
 * @param fileUri Stores path of selected file/directory in VS Code explorer
 * @param store Stores some runtime info
 */
async function show(fileUri: any, store: Store) {
    const cvsRoot = Utils.config.getCVSRoot();
    if (!cvsRoot) {
        return vscode.window.showErrorMessage(`Unable to get vscode-cvs.CVSROOT variable`);
    }
    
    let cvs: shower.IShower = new shower.BasePathShower(cvsRoot as string, Utils.folder.getSelected(fileUri));
    cvs.show(store);
}

/*******************************************************************/
/**
 * Checkout CVS module
 * @param fileUri Stores path of selected file/directory in VS Code explorer
 * @param store Stores some runtime info
 */
async function checkout(fileUri: any, store: Store) {
    const cvsRoot = Utils.config.getCVSRoot();
    if (!cvsRoot) {
        return vscode.window.showErrorMessage(`Unable to get vscode-cvs.CVSROOT variable`);
    }

	const moduleName = await vscode.window.showInputBox({
        placeHolder: 'Input module name here',
        validateInput: text => {
			return text === '' ? 'Please input module name' : null;
		}
    });

    if (moduleName !== undefined) {
        const branchTag = await vscode.window.showInputBox({
            placeHolder: 'Input branch or tag here',
            validateInput: text => {
                return text === '' ? 'Please input branch or tag' : null;
            }
        });

        if (branchTag !== undefined) {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "CVS checkout",
                cancellable: true
            }, async (progress, token) => {
                let cvs: checkouter.ICheckouter = new checkouter.ModuleCheckouter(
                    cvsRoot as string, Utils.folder.getSelected(fileUri), moduleName, branchTag);
                    
                return cvs.checkout(progress, token, store);
            });
        }
    }
}

/*******************************************************************/
/**
 * Compare opened file in current VS Code window with latest clean copy from repository
 * @param fileUri Stores path of selected file/directory in VS Code explorer
 * @param store Stores some runtime info
 */
async function compare(fileUri: any, store: Store) {
    const cvsRoot = Utils.config.getCVSRoot();
    if (!cvsRoot) {
        return vscode.window.showErrorMessage('Unable to get vscode-cvs.CVSROOT variable');
    }

    const {activeTextEditor} = vscode.window;
    const opened = activeTextEditor && activeTextEditor.document.uri.fsPath;
    if (!opened) {
        return vscode.window.showErrorMessage('You cannot compare an unopened or unsaved file');
    }

    const workDir = Utils.folder.getRoot(opened);
	let cvs: comparator.IComparator = new comparator.OpenedFileWithLatestCleanCopyComparator(
        cvsRoot as string, workDir as string, Utils.folder.getRelative(opened, workDir as string), opened);

    cvs.compare(store);
}

/*******************************************************************/
/**
 * Update local repository
 * @param fileUri Stores path of selected file/directory in VS Code explorer
 * @param store Stores some runtime info
 */
async function update(fileUri: any, store: Store) {
    const cvsRoot = Utils.config.getCVSRoot();
    if (!cvsRoot) {
        return vscode.window.showErrorMessage(`Unable to get vscode-cvs.CVSROOT variable`);
    }

    let cvs: updater.IUpdater | undefined

    vscode.window.showInformationMessage('Do you want to specify branch or tag?');
    const choice = await vscode.window.showQuickPick(['no', 'yes'], {placeHolder: 'yes or no'});
    if (choice === 'yes') {
        const branchTag = await vscode.window.showInputBox({
            placeHolder: 'Input branch or tag here',
            validateInput: text => {
                return text === '' ? 'Please input branch or tag' : null;
            }
        });

        if (branchTag === undefined)
            return;

        cvs = new updater.SpecificBranchTagUpdater(cvsRoot as string, Utils.folder.getSelected(fileUri), branchTag);
    }
    else if (choice === 'no') {
        cvs = new updater.Updater(cvsRoot as string, Utils.folder.getSelected(fileUri));
    }
    else {
        return;
    }

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "CVS update",
        cancellable: true
    }, async (progress, token) => {            
        return cvs!.update(progress, token, store);
    });
}

/*******************************************************************/
/**
 * Exports
 */
export {commit, commit_content, add, show, checkout, compare, update};