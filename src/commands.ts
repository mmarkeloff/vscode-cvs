////////////////////////////////////////////////////////////////////
/**
 * Imports
 */
import * as vscode from 'vscode';
import * as fs from 'fs';

import CVS from './cvs';
import ExtensionVDB from './vdb';
import {ExtensionChannel} from './log';
import Utils from './utils';
import * as cvs_commit from './commit';
import * as cvs_add from './add';
import * as cvs_remove from './remove'
import * as cvs_show_changes from './show_changes';
import * as cvs_checkout from './checkout';
import * as cvs_compare from './compare';
import * as cvs_update from './update';
import * as webview_panel from './webview_panel';
import * as messages from './messages';

////////////////////////////////////////////////////////////////////
async function commit_content(file_uri: any, vdb: ExtensionVDB, logger: ExtensionChannel) {
    const workDir = Utils.Path.get_selected(file_uri);
    const cvsRoot = Utils.Extension.get_cvs_root();
    if (!cvsRoot) {
        return new messages.ErrorMessage(messages.CVSROOT_ERROR).show();
    }

    const cvs = new CVS(cvsRoot as string, workDir, vdb, logger);

    const res = await cvs.onGetChanges();
    if (res[0]) {
        new messages.ErrorMessage(`Unable to get changes in local copy of repository: ${workDir}`).show();
    }
    else {
        if (res[1]) {
            const modified = Utils.File.getModified(res[1]);
            const added = Utils.File.getAdded(res[1]);
            const removed = Utils.File.getRemoved(res[1]);

            if (modified.length || added.length || removed.length) {
                const res = await webview_panel.commit_content_panel(
                    vdb, 
                    logger, 
                    cvsRoot as string, 
                    workDir, 
                    modified, 
                    added, 
                    removed
                );

                if (res) {
                    const message = 
                        res[0] === '' 
                        ? 
                        `Are you sure want to commit files from local copy of repository: ${workDir} with empty comment?`
                        :
                        `Are you sure want to commit files from local copy of repository: ${workDir} with comment: ${res[0]}?`;

                    const choice = await vscode.window.showWarningMessage(message, {modal: true}, "Yes");
                    if (choice === "Yes") {
                        const cvs = new cvs_commit.CommitContent(cvsRoot as string, workDir, res[0]!, res[1]);
                        cvs.commit(vdb, logger);
                    }
                }
            }
            else {
                new messages.ModalInfoMessage(
                    `There is no changes to commit in local copy of repository: ${workDir}`
                ).show();
            }
        }
        else {
            new messages.ModalInfoMessage(
                `There is no changes to commit in local copy of repository: ${workDir}`
            ).show();
        }
    }
}

////////////////////////////////////////////////////////////////////
async function add(file_uri: any, vdb: ExtensionVDB, logger: ExtensionChannel) {
    const cvsRoot = Utils.Extension.get_cvs_root();
    if (!cvsRoot) {
        return new messages.ErrorMessage(messages.CVSROOT_ERROR).show();
    }

    const selected = Utils.Path.get_selected(file_uri);
    const workDir = Utils.Path.get_root_path();

    const cvs = new cvs_add.AddSelectedDir(
        cvsRoot as string, 
        workDir as string, 
        Utils.Path.get_relative(selected, workDir as string)
    );

    cvs!.add(vdb, logger);
}

////////////////////////////////////////////////////////////////////
async function add_content(file_uri: any, vdb: ExtensionVDB, logger: ExtensionChannel) {
    const path = require('path')

    const cvsRoot = Utils.Extension.get_cvs_root();
    if (!cvsRoot) {
        return new messages.ErrorMessage(messages.CVSROOT_ERROR).show();
    }

    const workDir = Utils.Path.get_selected(file_uri);
    const cvs = new CVS(cvsRoot as string, workDir, vdb, logger);

    const res = await cvs.onGetChanges();
    if (res[0]) {
        new messages.ErrorMessage(`Unable to get changes in local copy of repository: ${workDir}`).show();
    }
    else {
        if (res[1]) {
            const uncontrolled = Utils.File.getUncontrolled(res[1]);
            if (uncontrolled.length) {
                const fullFilePaths = uncontrolled.map(file => workDir + path.sep + file);

                const onlyFiles = fullFilePaths.filter(file => Utils.File.is_file(file));
                if (onlyFiles.length) {
                    const filesToAdd = await webview_panel.add_content_panel(
                        onlyFiles.map(file => Utils.Path.get_relative(file, workDir))
                    );

                    if (filesToAdd && filesToAdd.length) {
                        for (const file of filesToAdd) {
                            if (Utils.Extension.is_add_as_binary()) {
                                const cvs = new cvs_add.AddSelectedBinaryFile(
                                    cvsRoot as string, 
                                    workDir as string, 
                                    file
                                );

                                cvs.add(vdb, logger);
                            }
                            else {
                                const cvs = new cvs_add.AddSelectedTextFile(cvsRoot as string, workDir as string, file);
                                cvs.add(vdb, logger);
                            }
                        }
                    }
                }
                else {
                    new messages.ModalInfoMessage(
                        `There is no uncontrolled files to add in local copy of repository: ${workDir}`
                    ).show();
                }
            }
            else {
                new messages.ModalInfoMessage(
                    `There is no uncontrolled files to add in local copy of repository: ${workDir}`
                ).show();
            }
        }
        else {
            new messages.ModalInfoMessage(
                `There is no uncontrolled files to add in local copy of repository: ${workDir}`
            ).show();
        }
    }
}

////////////////////////////////////////////////////////////////////
async function remove_content(file_uri: any, vdb: ExtensionVDB, logger: ExtensionChannel) {
    const cvsRoot = Utils.Extension.get_cvs_root();
    if (!cvsRoot) {
        return new messages.ErrorMessage(messages.CVSROOT_ERROR).show();
    }

    const workDir = Utils.Path.get_selected(file_uri);
    const cvs = new CVS(cvsRoot as string, workDir, vdb, logger);

    const res = await cvs.onGetChanges();
    if (res[0]) {
        new messages.ErrorMessage(`Unable to get changes in local copy of repository: ${workDir}`).show();
    }
    else {
        if (res[1]) {
            const path = require('path')
            
            const notExisted = Utils.File.getUpdated(res[1]).filter(file => !fs.existsSync(workDir + path.sep + file));
            console.log(notExisted);
            if (notExisted.length) {
                const filesToRemove = await webview_panel.remove_content_panel(notExisted);
                if (filesToRemove && filesToRemove.length) {
                    for (const file of filesToRemove) {
                        const cvs = new cvs_remove.RemoveSelectedFile(cvsRoot as string, workDir as string, file);
                        cvs.remove(vdb, logger);
                    }
                }
            }
            else {
                new messages.ModalInfoMessage(
                    `There is no updated files to remove in local copy of repository: ${workDir}`
                ).show();
            }
        }
        else {
            new messages.ModalInfoMessage(
                `There is no updated files to remove in local copy of repository: ${workDir}`
            ).show();
        }
    }
}

////////////////////////////////////////////////////////////////////
async function show_changes(file_uri: any, vdb: ExtensionVDB, logger: ExtensionChannel) {
    const cvsRoot = Utils.Extension.get_cvs_root();
    if (!cvsRoot) {
        return new messages.ErrorMessage(messages.CVSROOT_ERROR).show();
    }
    
    let cvs = new cvs_show_changes.ShowChanges(cvsRoot as string, Utils.Path.get_selected(file_uri));
    cvs.show(vdb, logger);
}

////////////////////////////////////////////////////////////////////
async function checkout(file_uri: any, vdb: ExtensionVDB, logger: ExtensionChannel) {
    const cvsRoot = Utils.Extension.get_cvs_root();
    if (!cvsRoot) {
        return new messages.ErrorMessage(messages.CVSROOT_ERROR).show();
    }

	const moduleName = await vscode.window.showInputBox({
        placeHolder: 'Input module name here',
        validateInput: text => {
			return text === '' ? 'Please input module name' : null;
		}
    });

    if (moduleName) {
        const branchTag = await vscode.window.showInputBox({
            placeHolder: 'Input branch or tag here',
            validateInput: text => {
                return text === '' ? 'Please input branch or tag' : null;
            }
        });

        if (branchTag) {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "CVS checkout",
                cancellable: true
            }, async (progress, token) => {
                let cvs = new cvs_checkout.CheckoutModule(
                    cvsRoot as string, 
                    Utils.Path.get_selected(file_uri), 
                    moduleName, 
                    branchTag
                );
                    
                return cvs.checkout(progress, token, vdb, logger);
            });
        }
    }
}

////////////////////////////////////////////////////////////////////
async function compare(file_uri: any, vdb: ExtensionVDB, logger: ExtensionChannel) {
    const cvsRoot = Utils.Extension.get_cvs_root();
    if (!cvsRoot) {
        return new messages.ErrorMessage(messages.CVSROOT_ERROR).show();
    }

    const {activeTextEditor} = vscode.window;
    const opened = activeTextEditor && activeTextEditor.document.uri.fsPath;
    if (!opened) {
        return new messages.ErrorMessage(messages.COMPARE_ERROR).show();
    }

    const workDir = Utils.Path.get_root_path(opened);
	let cvs = new cvs_compare.CompareFileWithLatestCleanCopy(
        cvsRoot as string, 
        workDir as string, 
        Utils.Path.get_relative(opened, workDir as string), 
        opened
    );

    cvs.compare(vdb, logger);
}

////////////////////////////////////////////////////////////////////
async function update(file_uri: any, vdb: ExtensionVDB, logger: ExtensionChannel) {
    const cvsRoot = Utils.Extension.get_cvs_root();
    if (!cvsRoot) {
        return new messages.ErrorMessage(messages.CVSROOT_ERROR).show();
    }

    let cvs: cvs_update.IUpdate | undefined
    vscode.window.showInformationMessage('Do you want to specify branch or tag?');

    const choice = await vscode.window.showQuickPick(['no', 'yes'], {placeHolder: 'yes or no'});
    if (choice === 'yes') {
        const branchTag = await vscode.window.showInputBox({
            placeHolder: 'Input branch or tag here',
            validateInput: text => {
                return text === '' ? 'Please input branch or tag' : null;
            }
        });

        if (!branchTag)
            return;

        cvs = new cvs_update.UpdateBySpecificBranchTag(cvsRoot as string, Utils.Path.get_selected(file_uri), branchTag);
    }
    else if (choice === 'no') {
        cvs = new cvs_update.Update(cvsRoot as string, Utils.Path.get_selected(file_uri));
    }
    else {
        return;
    }

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "CVS update",
        cancellable: true
    }, async (progress, token) => {            
        return cvs!.update(progress, token, vdb, logger);
    });
}

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export {commit_content, add, add_content, remove_content, show_changes, checkout, compare, update};