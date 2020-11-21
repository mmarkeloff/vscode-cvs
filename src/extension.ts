import * as vscode from 'vscode';
import {Store} from './store';
import {commitOpenedFile, commitSelectedDirContent} from './commit';
import {addOpenedFile, addSelectedDir} from './add';
import {showChangesSelectedDir} from './show';
import {checkoutModule} from './checkout';
import {compareOpenedFile} from './compare';

/*******************************************************************/
/**
 * Activate extension
 */
export function activate(context: vscode.ExtensionContext) {
	/*
		Get vscode-cvs.CVSROOT variable from user settings.json
	*/
	const cvsRoot = vscode.workspace.getConfiguration('vscode-cvs').get('CVSROOT');
	if (!cvsRoot) {
		return vscode.window.showErrorMessage(
			'Unable to load vscode-cvs extension, because vscode-cvs.CVSROOT variable in settings.json is unset'
		);
	}

	/*
		Get current opened directory in VS Code explorer
	*/
	const workDir = vscode.workspace.rootPath;
	if (!workDir) {
		return vscode.window.showErrorMessage(
			'Unable to load vscode-cvs extension, because folder in current VS Code window is not opened'
        );
	}

	/*
		Stores some runtime info
	*/
	let store: Store = new Store(vscode.window.createOutputChannel("vscode-cvs"));

	/*
		CodeCVS: commit opened file in current window
	*/
	const commit = vscode.commands.registerTextEditorCommand('vscode-cvs.commit', async (textEditor) => {
		commitOpenedFile(textEditor.document.fileName, workDir, cvsRoot as string, store);
	});

	/*
		CodeCVS: smart commit from local directory
	*/
	const commit_content = vscode.commands.registerCommand('vscode-cvs.commit_content', async (fileUri) => {
		let targetPath = fileUri === undefined ? workDir : fileUri.fsPath;
		commitSelectedDirContent(targetPath, cvsRoot as string, store);
	});

	/*
		CodeCVS: add opened file in current window
	*/
	const add = vscode.commands.registerTextEditorCommand('vscode-cvs.add', async (textEditor) => {
		addOpenedFile(textEditor.document.fileName, workDir, cvsRoot as string, store);
	});

	/*
		CodeCVS: add local directory to repository
	*/
	const add_dir = vscode.commands.registerCommand('vscode-cvs.add_dir', async (fileUri) => {
		addSelectedDir(fileUri.fsPath, workDir ,cvsRoot as string, store);
	});

	/*
		CodeCVS: show changes in local directory
	*/
	const show = vscode.commands.registerCommand('vscode-cvs.show', async (fileUri) => {
		let targetPath = fileUri === undefined ? workDir : fileUri.fsPath;
		showChangesSelectedDir(targetPath, cvsRoot as string, store);
	});

	/*
		CodeCVS: checkout ...
	*/
	const checkout = vscode.commands.registerCommand('vscode-cvs.checkout', async (fileUri) => {
		let targetPath = fileUri === undefined ? workDir : fileUri.fsPath;
		checkoutModule(targetPath, cvsRoot as string, store);
	});

	/*
		CodeCVS: compare
	*/
	const compare = vscode.commands.registerTextEditorCommand('vscode-cvs.compare', async (textEditor) => {
		compareOpenedFile(textEditor.document.fileName, workDir, cvsRoot as string, store);
	});

	context.subscriptions.push(commit, commit_content, add, add_dir, show, checkout, compare);
}

/*******************************************************************/
/**
 * Deactivate extension
 */
export function deactivate() {}
