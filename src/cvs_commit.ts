/*******************************************************************/
/**
 * Imports
 */
import {spawn} from 'child_process';
import {window} from 'vscode';
import Store from './store';
import CVS from './cli_cvs_clnt_wrap';

/*******************************************************************/
/**
 * Interface for commit some local object to remote repository
 */
interface ICommiter {
    /** CVSROOT variable */
    m_CVSRoot: string;
    /** Working directory for run CLI CVS client */
    m_WorkDir: string;
    /** Commit comment */
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
    /** Relative path to opened file in current VS Code window */
    m_OpenedFile: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CLI CVS client
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

        // Waiting for the command to complete
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
    m_Files: string[];

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CLI CVS client
     * @param comment Commit comment
     */
    constructor(cvsRoot: string, workDir: string, comment: string, files: string[]) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_Comment = comment;
        this.m_Files = files;
    }

    /**
     * Smart commit content of selected directory in VS Code explorer to remote repository
     * @param store Stores some runtime info
     */
    async commit(store: Store) {
        let cvs: CVS = new CVS(this.m_CVSRoot, this.m_WorkDir, store);
        for (const file of this.m_Files) {
            // Make pure path from path with prefix
            // example: objWithPref='M a/b/c.txt' => obj='a/b/c.txt'
            let obj = file.slice(2);

            // User remove file or directory
            if (file.startsWith('U ')) {
                // Waiting for the command to complete
                const code = await cvs.onRemove(obj);
                if (code) {
                    window.showErrorMessage(`Unable to remove: ${obj}`);
                }
                else {
                    window.showInformationMessage(`File or directory: ${obj} has been removed`);
                }
            } 
            // User add file or directory
            else if (file.startsWith('? ')) {
                // Waiting for the command to complete
                const code = await cvs.onAddCommon(obj);
                if (code) {
                    window.showErrorMessage(`Unable to add: ${obj}`);
                }
                else {
                    window.showInformationMessage(`File or directory: ${obj} has been added`);
                }
            }

            // Waiting for the command to complete
            const code = await cvs.onCommit(obj, this.m_Comment);
            if (code) {
                window.showErrorMessage(`Unable to commit: ${obj}`);
            }
            else {
                window.showInformationMessage(`File or directory: ${obj} has been commited`);
            }
        }
    }
}

/*******************************************************************/
/**
 * Exports
 */
export {ICommiter, OpenedFileCommiter, SelectedDirContentCommiter};