import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {Store} from './store';
import {CVS} from './cvs';
import * as common from './common';

/*******************************************************************/
/**
 * Class for compare opened file in current VS Code window with clean copy from repository
 */
class Comparator {
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
     * Relative opened file path
     */
    m_File: string;
    /**
     * Full opened file path
     */
    m_FullFilePath: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CVS client utility
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
     * Compare opened file in current VS Code window with clean copy from repository
     * @param store Stores some runtime info
     */
    async compare(store: Store) {
        fs.mkdtemp(path.join(os.tmpdir(), 'vscode-cvs-'), async (err, tempDir) => {
            if (err) {
                vscode.window.showErrorMessage('Unable to create temp directory');
            }
            else {
                let err: number
                const ext = path.parse(this.m_FullFilePath).ext

                err = await common.mv(this.m_FullFilePath, this.m_FullFilePath + '.vscode-cvs.temp');
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

                /*
                    Check that clean copy is really has been checkouted
                */
                fs.stat(this.m_FullFilePath, async (stat) => {
                    if (stat && stat.code === 'ENOENT') {
                        /*
                            File not found
                        */
                        vscode.window.showErrorMessage(`Unable to get clean copy of file: ${this.m_File} from repository`);

                        err = await common.mv(this.m_FullFilePath + '.vscode-cvs.temp', this.m_FullFilePath);
                        if (err) {
                            vscode.window.showErrorMessage(`Unable to restore backuped file: ${this.m_File}`);
                        }
                    }
                    else {
                        err = await common.mv(this.m_FullFilePath, tempDir + '-clean-copy' + ext);
                        if (err) {
                            vscode.window.showErrorMessage(`Unable to move clean copy of file: ${this.m_File}`);
                            throw err;
                        }

                        err = await common.mv(this.m_FullFilePath + '.vscode-cvs.temp', this.m_FullFilePath);
                        if (err) {
                            vscode.window.showErrorMessage(
                                `Unable to restore backuped file: ${this.m_FullFilePath + '.vscode-cvs.temp'}`
                            );
                            throw err;
                        }

                        common.diff(tempDir + '-clean-copy' + ext, this.m_FullFilePath);
                    }
                });
            }
        });
    }
}

/*******************************************************************/
/**
 * Compare opened file in current VS Code window with clean copy from repository
 * @param openedFile Full opened file path
 * @param workDir Working directory for run CVS client utility
 * @param cvsRoot CVSROOT variable
 * @param store Stores some runtime info
 */
export async function compareOpenedFile(openedFile: string, workDir: string, cvsRoot: string, store: Store) {
    const file = openedFile.replace(workDir + '/', '');
	let comparator: Comparator = new Comparator(cvsRoot, workDir, file, openedFile);
    comparator.compare(store);
}