/*******************************************************************/
/**
 * Imports
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import Store from './store';
import Utils from './utils';
import * as commiter from './cvs/commiter';
import * as adder from './cvs/adder';
import * as shower from './cvs/shower';
import * as checkouter from './cvs/checkouter';
import * as comparator from './cvs/comparator';
import * as updater from './cvs/updater';

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

	const comment = await vscode.window.showInputBox({
		value: store.getLastComment(),
        placeHolder: 'Input comment for your commit here',
        validateInput: text => {
			return text === '' ? 'Please input comment' : null;
		}
    });

    if (comment !== undefined) {
        const workDir = Utils.folder.getRoot(opened);
        const file = Utils.folder.getRelative(opened, workDir as string);

        vscode.window.showInformationMessage(
            `Are you sure want to commit opened file in current window: ${file} with comment: ${comment}?`
        );

	    const choice = await vscode.window.showQuickPick(['yes', 'no'], {placeHolder: 'yes or no'});
        if (choice === 'yes') {
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

	const comment = await vscode.window.showInputBox({
		value: store.getLastComment(),
        placeHolder: 'Input comment for your commit here',
        validateInput: text => {
			return text === '' ? 'Please input comment' : null;
		}
    });

    if (comment !== undefined) {
        const workDir = Utils.folder.getSelected(fileUri);

        vscode.window.showInformationMessage(
            `Are you sure want to commit files from local directory: ${workDir} with comment: ${comment}?`
        );

	    const choice = await vscode.window.showQuickPick(['yes', 'no'], {placeHolder: 'yes or no'});
        if (choice === 'yes') {
            let cvs: commiter.ICommiter = new commiter.SelectedDirContentCommiter(
                cvsRoot as string, workDir, comment!);

            cvs.commit(store);
        }
    }
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