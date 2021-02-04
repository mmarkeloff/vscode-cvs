////////////////////////////////////////////////////////////////////
/**
 * Imports
 */
import {CancellationToken, Progress} from 'vscode';
import {spawn} from 'child_process';

import ExtensionVDB from './vdb';
import {ExtensionChannel} from './log';
import {ErrorMessage, InfoMessage} from './messages';

////////////////////////////////////////////////////////////////////
/**
 * Interface for update local repository
 */
interface IUpdate {
    m_CVSRoot: string; ///< CVSROOT
    m_WorkDir: string; ///< working dir

    update(
        progress: Progress<{message?: string; increment?: number}>, 
        token: CancellationToken, 
        vdb: ExtensionVDB,
        logger: ExtensionChannel
    ): Promise<void>;
}

////////////////////////////////////////////////////////////////////
/**
 * Class for update local repository 
 */
class Update implements IUpdate {
    m_CVSRoot: string;
    m_WorkDir: string;

    /**
     * Constructor
     * @param cvs_root CVSROOT
     * @param work_dir working dir
     */
    constructor(cvs_root: string, work_dir: string) {
        this.m_CVSRoot = cvs_root;
        this.m_WorkDir = work_dir;
    }

    update(
        progress: Progress<{message?: string; increment?: number}>, 
        token: CancellationToken, 
        vdb: ExtensionVDB,
        logger: ExtensionChannel
    ): Promise<void> 
    {
        return new Promise<void>((resolve, reject) => {
            if (token.isCancellationRequested) {
                return;
            }
    
            let progressUpdate = 'starting up...';
            const interval = setInterval(() => progress.report({message: progressUpdate}), 500);
    
            const proc = spawn(
                'cvs', 
                ['-d', this.m_CVSRoot, 'update', '-d', '-P', '.'], 
                {cwd: this.m_WorkDir})
                .on("close", (code, signal) => {
                    if (code) {
                        new ErrorMessage(`Unable to update local copy of repository: ${this.m_WorkDir}`).show();
                    }
                    else {
                        new InfoMessage(`Local copy of repository: ${this.m_WorkDir} has been updated`).show();
                    }

                    resolve();
                    clearInterval(interval);
                })
                .on("error", err => {
                    reject(err);
                });
    
                proc.stdout
                .on("data", (chunk: string | Buffer) => {
                    logger.print(chunk.toString().slice(2));
                    progressUpdate = chunk.toString('utf8', 0, 50).replace(/[\r\n]/g, '').slice(2);
                });

                proc.stderr
                .on("data", (chunk: string | Buffer) => {
                    logger.print(chunk.toString());
                });
    
            token.onCancellationRequested(_ => proc.kill());
        });
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Class for update local repository with specific branch/tag
 */
class UpdateBySpecificBranchTag implements IUpdate {
    m_CVSRoot: string;
    m_WorkDir: string;
    m_BranchTag: string; ///< specific branch/tag

    /**
     * Constructor
     * @param cvs_root CVSROOT
     * @param work_dir working dir
     * @param branch_tag specific branch/tag
     */
    constructor(cvs_root: string, work_dir: string, branch_tag: string) {
        this.m_CVSRoot = cvs_root;
        this.m_WorkDir = work_dir;
        this.m_BranchTag = branch_tag;
    }

    update(
        progress: Progress<{message?: string; increment?: number}>, 
        token: CancellationToken, 
        vdb: ExtensionVDB,
        logger: ExtensionChannel
    ): Promise<void> 
    {
        return new Promise<void>((resolve, reject) => {
            if (token.isCancellationRequested) {
                return;
            }
    
            let progressUpdate = 'starting up...';
            const interval = setInterval(() => progress.report({message: progressUpdate}), 500);
    
            const proc = spawn(
                'cvs', 
                ['-d', this.m_CVSRoot, 'update', '-r', this.m_BranchTag, '-d', '-P', '.'], 
                {cwd: this.m_WorkDir})
                .on("close", (code, signal) => {
                    if (code) {
                        new ErrorMessage(
                            `Unable to update local copy of repository: ${this.m_WorkDir} 
                            to branch or tag: ${this.m_BranchTag}`
                        ).show();
                    }
                    else {
                        new InfoMessage(
                            `Local copy of repository: ${this.m_WorkDir} has been updated 
                            to branch or tag: ${this.m_BranchTag}`
                        ).show();
                    }

                    resolve();
                    clearInterval(interval);
                })
                .on("error", err => {
                    reject(err);
                });
    
                proc.stdout
                .on("data", (chunk: string | Buffer) => {
                    logger.print(chunk.toString().slice(2));
                    progressUpdate = chunk.toString('utf8', 0, 50).replace(/[\r\n]/g, '').slice(2);
                });

                proc.stderr
                .on("data", (chunk: string | Buffer) => {
                    logger.print(chunk.toString());
                });
    
            token.onCancellationRequested(_ => proc.kill());
        });
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export {IUpdate, Update, UpdateBySpecificBranchTag};