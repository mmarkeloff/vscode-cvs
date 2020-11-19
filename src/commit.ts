import {spawn} from 'child_process';
import {window} from 'vscode';
import {Store} from './store';
import {CVS} from './cvs';

/*******************************************************************/
/**
 * Interface for commit some local object to remote repository
 */
interface ICommiter {
    /**
     * CVSROOT variable
     */
    m_CVSRoot: string;
    /**
     * Working directory for run CVS client utility.
     * If command called via the Command Palette, 
     * variable will be set in path of opened directory in VS Code explorer.
     * If command called via the `explorer` contextual menu, 
     * varuable will be set in path of selected directory in VS Code explorer
     */
    m_WorkDir: string;
    /**
     * Commit comment
     */
    m_Comment: string;

    /**
     * Commit some local object to remote repository
     * @param store Stores some runtime info
     */
    commit(store: Store) : void;
}

/*******************************************************************/
/**
 * Class for commit opened file in current VS Code window to remote repository
 */
class OpenedFileCommiter implements ICommiter {
    m_CVSRoot: string;
    m_WorkDir: string;
    m_Comment: string;

    /**
     * Relative path to opened file in current VS Code window
     */
    m_OpenedFile: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CVS client utility
     * @param comment Commit comment
     * @param openedFile Relative path to opened file in current VS Code window
     */
    constructor(cvsRoot: string, workDir: string, comment: string, openedFile: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_Comment = comment;
        this.m_OpenedFile = openedFile;
    }

    /**
     * Commit opened file in current VS Code window to remote repository
     * @param store Stores some runtime info
     */
    async commit(store: Store) {
        let cvs: CVS = new CVS(this.m_CVSRoot, this.m_WorkDir, store);

        /*
            Waiting for the command to complete
        */
        const code = await cvs.onCommit(this.m_OpenedFile, this.m_Comment);
        if (code) {
            window.showErrorMessage(`Unable to commit opened file in current window: ${this.m_OpenedFile}`);
        }
        else {
            window.showInformationMessage(`Opened file in current window: ${this.m_OpenedFile} has been commited`);
        }
    }
}

/*******************************************************************/
/**
 * Class for smart commit content of selected directory in VS Code explorer to remote repository
 * @warning Locally added files/directories will be added to remote repository
 * @warning Locally removed files/directories will be removed from remote repository
 * @warning Implementation is not recursive, it means that locally added subdirectories 
 * cannot be added to remote repository. That is, class will add to remote repository only those 
 * locally added files/directories that are displayed by the command 'vscode-cvs.show'
 */
class SelectedDirContentCommiter implements ICommiter {
    m_CVSRoot: string;
    m_WorkDir: string;
    m_Comment: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CVS client utility
     * @param comment Commit comment
     */
    constructor(cvsRoot: string, workDir: string, comment: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_Comment = comment;
    }

    /**
     * Remove or add + commit some object
     * @param objWithPref Obj path with prefix 'X '
     * @param cvs CVS operations executer
     */
    private async careObj(objWithPref: string, cvs: CVS) {
        /*
            Make pure path from path with prefix
            example: objWithPref='M a/b/c.txt' => obj='a/b/c.txt'
        */
        let obj = objWithPref.slice(2);

        /*
            User remove file or directory
        */
        if (objWithPref.startsWith('U ')) {
            /*
                Waiting for the command to complete
            */
            const code = await cvs.onRemove(obj);
            if (code) {
                window.showErrorMessage(`Unable to remove: ${obj}`);
            }
            else {
                window.showInformationMessage(`File or directory: ${obj} has been removed`);
            }
        } 
        /*
            User add file or directory
        */
        else if (objWithPref.startsWith('? ')) {
            /*
                Waiting for the command to complete
            */
            const code = await cvs.onAddText(obj);
            if (code) {
                window.showErrorMessage(`Unable to add: ${obj}`);
            }
            else {
                window.showInformationMessage(`File or directory: ${obj} has been added`);
            }
        }

        /*
            Waiting for the command to complete
        */
        const code = await cvs.onCommit(obj, this.m_Comment);
        if (code) {
            window.showErrorMessage(`Unable to commit: ${obj}`);
        }
        else {
            window.showInformationMessage(`File or directory: ${obj} has been commited`);
        }
    }

    /**
     * Smart commit content of selected directory in VS Code explorer to remote repository
     * @param store Stores some runtime info
     */
    async commit(store: Store) {
        /*
            Stores changes in working directory
        */
        let changes: String = '';
        let cvs: CVS = new CVS(this.m_CVSRoot, this.m_WorkDir, store);

        let proc = spawn(
            'cvs', 
            ['-d', this.m_CVSRoot, '-qn', 'update'], 
            {cwd: this.m_WorkDir})
            .on("close", async (code, signal) => {
                if (code) {
                    window.showErrorMessage(
                        `Unable to get changes in local directory: ${this.m_WorkDir}`
                    );
                }
                else {
                    /*
                        Array of paths with prefix 'X '
                    */
                    const withPref = changes.replace(/[\r\n]/g, '\n').split('\n');

                    for (const objWithPref of withPref) {
                        /*
                            Skip last element
                        */
                        if (objWithPref !== '') {
                            this.careObj(objWithPref, cvs);
                        }
                    }
                }
            });

            proc.stdout
                .on("data", (chunk: string | Buffer) => {
                    /*
                        Collect changes
                    */
                    changes += chunk.toString();
                });

            proc.stderr
                .on("data", (chunk: string | Buffer) => {
                    /*
                        Print stderr to OUTPUT tab
                    */
                    store.printToLog(chunk as string);
                });
    }
}

/*******************************************************************/
/**
 * Commit opened file in current VS Code window to remote repository
 * @param openedFile Absolute path to opened file in current VS Code window 
 * @param workDir Working directory for run cvs client utility
 * @param cvsRoot CVSROOT variable
 * @param store Stores some runtime info
 */
export async function commitOpenedFile(openedFile: string, workDir: string, cvsRoot: string, store: Store) {
    /*
        Make relative path to opened file in current VS Code window
        Example: openedFile='/a/b/c/d.txt' + workDir='/a/b' => file='c/d.txt'
    */
    const file = openedFile.replace(workDir + '/', '');

	const comment = await window.showInputBox({
		value: store.getLastComment(),
        placeHolder: 'Input comment for your commit here',
        validateInput: text => {
			return text === '' ? 'Please input comment' : null;
		}
    });

    if (comment !== undefined) {
        window.showInformationMessage(
            `Are you sure to commit opened file in current window: ${file} with comment: ${comment}?`
        );

	    const choice = await window.showQuickPick(['yes', 'no'], {placeHolder: 'yes or no'});
        if (choice === 'yes') {
            let commiter: ICommiter = new OpenedFileCommiter(cvsRoot, workDir, comment!, file);
            commiter.commit(store);
        }
    }
}

/*******************************************************************/
/**
 * Smart commit content of selected directory in VS Code explorer to remote repository
 * @param workDir Absolute path to selected directory in VS Code explorer
 * @param cvsRoot CVSROOT variable
 * @param store Stores some runtime info
 */
export async function commitSelectedDirContent(workDir: string, cvsRoot: string, store: Store) {
	const comment = await window.showInputBox({
		value: store.getLastComment(),
        placeHolder: 'Input comment for your commit here',
        validateInput: text => {
			return text === '' ? 'Please input comment' : null;
		}
    });

    if (comment !== undefined) {
        window.showInformationMessage(
            `Are you sure want to commit files from local directory: ${workDir} with comment: ${comment}?`
        );

	    const choice = await window.showQuickPick(['yes', 'no'], {placeHolder: 'yes or no'});
        if (choice === 'yes') {
            let commiter: ICommiter = new SelectedDirContentCommiter(cvsRoot, workDir, comment!);
            commiter.commit(store);
        }
    }
}