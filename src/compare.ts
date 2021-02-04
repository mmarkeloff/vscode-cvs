/*******************************************************************/
/**
 * Imports
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import CVS from './cvs';
import ExtensionVDB from './vdb';
import {ExtensionChannel} from './log';
import Utils from './utils';
import {ErrorMessage} from './messages';

////////////////////////////////////////////////////////////////////
/**
 * Interface for compare file
 */
interface ICompare {
    m_CVSRoot: string; ///< CVSROOT
    m_WorkDir: string; ///< working dir
    m_FilePath: string; ///< file path
    m_FullFilePath: string; ///< full file path

    compare(vdb: ExtensionVDB, logger: ExtensionChannel) : void;
}


////////////////////////////////////////////////////////////////////
/**
 * Class for compare file with latest clean copy from repository
 */
class CompareFileWithLatestCleanCopy implements ICompare {
    m_CVSRoot: string;
    m_WorkDir: string;
    m_FilePath: string;
    m_FullFilePath: string;

    /**
     * Constructor
     * @param cvs_root CVSROOT
     * @param work_dir working dir
     * @param file_path file path
     * @param full_file_path full file path
     */
    constructor(cvs_root: string, work_dir: string, file_path: string, full_file_path: string) {
        this.m_CVSRoot = cvs_root;
        this.m_WorkDir = work_dir;
        this.m_FilePath = file_path;
        this.m_FullFilePath = full_file_path;
    }

    async compare(vdb: ExtensionVDB, logger: ExtensionChannel) {
        const err = await Utils.File.mv(this.m_FullFilePath, this.m_FullFilePath + '.temp');
        if (err) {
            new ErrorMessage(`Unable to backup file: ${this.m_FilePath}`).show();
            throw err;
        }

        const cvs = new CVS(this.m_CVSRoot, this.m_WorkDir, vdb, logger);

        const code = await cvs.onUpdateSingleFile(this.m_FilePath);
        if (code) {
            new ErrorMessage(`Unable to get clean copy of file: ${this.m_FilePath} from repository`).show();
            throw code;
        }

        fs.stat(this.m_FullFilePath, async (stat) => {
            if (stat && stat.code === 'ENOENT') {
                new ErrorMessage(`Unable to get clean copy of file: ${this.m_FilePath} from repository`).show();

                const err = await Utils.File.mv(this.m_FullFilePath + '.temp', this.m_FullFilePath);
                if (err) {
                    new ErrorMessage(`Unable to restore backed file: ${this.m_FilePath}`).show();
                }
            }
            else {
                const cleanCopy = 
                    path.parse(this.m_FullFilePath).dir + 
                    path.sep +
                    path.parse(this.m_FullFilePath).name + 
                    '-clean-copy' + 
                    path.parse(this.m_FullFilePath).ext

                let err = await Utils.File.mv(this.m_FullFilePath, cleanCopy);
                if (err) {
                    new ErrorMessage(`Unable to move clean copy of file: ${this.m_FilePath}`).show();
                    throw err;
                }

                err = await Utils.File.mv(this.m_FullFilePath + '.temp', this.m_FullFilePath);
                if (err) {
                    new ErrorMessage(`Unable to restore backed file: ${this.m_FullFilePath + '.temp'}`).show();
                    throw err;
                }

                vscode.workspace.onDidCloseTextDocument((closedFile: vscode.TextDocument) => {
                    if (closedFile.fileName === cleanCopy) {
                        fs.unlink(cleanCopy, (err) => {})
                    }
                });

                this.diff(cleanCopy, this.m_FullFilePath, this.m_FilePath);
            }
        });
    }

    private diff(lhs: string, rhs: string, show_file_path: string) {
        const lhsUri = vscode.Uri.file(lhs);
        const rhsUri = vscode.Uri.file(rhs);
        return vscode.commands.executeCommand('vscode.diff', lhsUri, rhsUri, 'remote ↔ local (' + show_file_path + ')');
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export {ICompare, CompareFileWithLatestCleanCopy};
