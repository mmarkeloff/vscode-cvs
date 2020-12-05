/*******************************************************************/
/**
 * Imports
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Store from '../store';
import Utils from '../utils';
import CVS from './cvs';

/*******************************************************************/
/**
 * Interface for compare some files
 */
interface IComparator {
    /** CVSROOT variable */
    m_CVSRoot: string;
    /** Working directory for run CLI CVS client */
    m_WorkDir: string;
    /** Relative file path */
    m_File: string;
    /** Full file path */
    m_FullFilePath: string;

    /**
     * Compare some files
     * @param store Stores some runtime info
     */
    compare(store: Store) : void;
}


/*******************************************************************/
/**
 * Class for compare opened file in current VS Code window with latest clean copy from remote repository
 */
class OpenedFileWithLatestCleanCopyComparator implements IComparator {
    m_CVSRoot: string;
    m_WorkDir: string;
    /** Relative opened file path */
    m_File: string;
    /** Full opened file path */
    m_FullFilePath: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CLI CVS client
     * @param file Relative opened file path
     * @param fullFilePath Full opened file path
     */
    constructor(cvsRoot: string, workDir: string, file: string, fullFilePath: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_File = file;
        this.m_FullFilePath = fullFilePath;
    }

    /**
     * Compare opened file in current VS Code window with latest clean copy from repository
     * @param store Stores some runtime info
     */
    async compare(store: Store) {
        let err = await Utils.file.mv(this.m_FullFilePath, this.m_FullFilePath + '.temp');
        if (err) {
            vscode.window.showErrorMessage(`Unable to backup opened file: ${this.m_File}`);
            throw err;
        }

        let cvs: CVS = new CVS(this.m_CVSRoot, this.m_WorkDir, store);
        const code = await cvs.onUpdateSingleFile(this.m_File);
        if (code) {
            vscode.window.showErrorMessage(`Unable to get clean copy of file: ${this.m_File} from repository`);
            throw code;
        }

        // Check that clean copy is really has been checkouted
        fs.stat(this.m_FullFilePath, async (stat) => {
            if (stat && stat.code === 'ENOENT') {
                // File not found
                vscode.window.showErrorMessage(`Unable to get clean copy of file: ${this.m_File} from repository`);

                err = await Utils.file.mv(this.m_FullFilePath + '.temp', this.m_FullFilePath);
                if (err) {
                    vscode.window.showErrorMessage(`Unable to restore backuped file: ${this.m_File}`);
                }
            }
            else {
                // File found
                const cleanCopy = path.parse(this.m_FullFilePath).dir + path.sep +
                    path.parse(this.m_FullFilePath).name + '-clean-copy' + path.parse(this.m_FullFilePath).ext

                err = await Utils.file.mv(this.m_FullFilePath, cleanCopy);
                if (err) {
                    vscode.window.showErrorMessage(`Unable to move clean copy of file: ${this.m_File}`);
                    throw err;
                }

                err = await Utils.file.mv(this.m_FullFilePath + '.temp', this.m_FullFilePath);
                if (err) {
                    vscode.window.showErrorMessage(
                        `Unable to restore backuped file: ${this.m_FullFilePath + '.temp'}`
                    );
                    throw err;
                }

                // Remove checkouted clean copy after closing VS Code text editor window
                vscode.workspace.onDidCloseTextDocument((closedFile: vscode.TextDocument) => {
                    if (closedFile.fileName === cleanCopy) {
                        fs.unlink(cleanCopy, (err) => {})
                    }
                });

                this.diff(cleanCopy, this.m_FullFilePath);
            }
        });
    }

    private diff(lhs: string, rhs: string) {
        const lhsUri = vscode.Uri.file(lhs);
        const rhsUri = vscode.Uri.file(rhs);
        return vscode.commands.executeCommand('vscode.diff', lhsUri, rhsUri, 'remote ↔ local');
    }
}

/*******************************************************************/
/**
 * Exports
 */
export {IComparator, OpenedFileWithLatestCleanCopyComparator};
