/*******************************************************************/
/**
 * Imports
 */
import {window, CancellationToken, Progress} from 'vscode';
import {spawn} from 'child_process';
import Store from '../store';

/*******************************************************************/
/**
 * Interface for update local repository
 */
interface IUpdater {
    /** CVSROOT variable */
    m_CVSRoot: string;
    /** Working directory for run CLI CVS client */
    m_WorkDir: string;

    /**
     * Update local repository
     * @param store Stores some runtime info
     */
    update(
        progress: Progress<{message?: string; increment?: number}>, 
        token: CancellationToken, 
        store: Store
    ): Promise<void>;
}

/*******************************************************************/
/**
 * Class for update local repository
 */
class Updater implements IUpdater {
    m_CVSRoot: string;
    m_WorkDir: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CLI CVS client
     */
    constructor(cvsRoot: string, workDir: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
    }

    /**
     * Update local repository
     * @param progress For progress bar
     * @param token For cancel operation
     * @param store Stores some runtime info
     */
    update(
        progress: Progress<{message?: string; increment?: number}>, 
        token: CancellationToken, 
        store: Store 
    ): Promise<void> 
    {
        return new Promise<void>((resolve, reject) => {
            // Cancel the operation
            if (token.isCancellationRequested) {
                return;
            }
    
            let progressUpdate = 'starting up...';
            const interval = setInterval(() => progress.report({message: progressUpdate}), 500);
    
            let proc = spawn(
                'cvs', 
                ['-d', this.m_CVSRoot, 'update', '-d', '-P', '.'], 
                {cwd: this.m_WorkDir})
                .on("close", (code, signal) => {
                    if (code) {
                        window.showErrorMessage(`Unable to update local repository: ${this.m_WorkDir}`);
                    }
                    else {
                        window.showInformationMessage(`Local repository: ${this.m_WorkDir} has been updated`);
                    }

                    // Done
                    resolve();
                    clearInterval(interval);
                })
                .on("error", err => {
                    reject(err);
                });
    
                proc.stdout
                .on("data", (chunk: string | Buffer) => {
                    // Print current updated file to OUTPUT tab
                    store.printToLog(chunk.toString());

                    // Print current updated file to progress bar
                    progressUpdate = chunk.toString('utf8', 0, 50).replace(/[\r\n]/g, '');
                });

                proc.stderr
                .on("data", (chunk: string | Buffer) => {
                    // Print stderr to OUTPUT tab
                    store.printToLog(chunk.toString());
                });
    
            // Kill CVS process to cancel the operation
            token.onCancellationRequested(_ => proc.kill());
        });
    }
}

/*******************************************************************/
/**
 * Class for update local repository to specific branch or tag
 */
class SpecificBranchTagUpdater implements IUpdater {
    m_CVSRoot: string;
    m_WorkDir: string;
    /** Branch name or tag */
    m_BranchTag: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CLI CVS client
     */
    constructor(cvsRoot: string, workDir: string, branchTag: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_BranchTag = branchTag;
    }

    /**
     * Update local repository to specific branch or tag
     * @param progress For progress bar
     * @param token For cancel operation
     * @param store Stores some runtime info
     */
    update(
        progress: Progress<{message?: string; increment?: number}>, 
        token: CancellationToken, 
        store: Store 
    ): Promise<void> 
    {
        return new Promise<void>((resolve, reject) => {
            // Cancel the operation
            if (token.isCancellationRequested) {
                return;
            }
    
            let progressUpdate = 'starting up...';
            const interval = setInterval(() => progress.report({message: progressUpdate}), 500);
    
            let proc = spawn(
                'cvs', 
                ['-d', this.m_CVSRoot, 'update', '-r', this.m_BranchTag, '-d', '-P', '.'], 
                {cwd: this.m_WorkDir})
                .on("close", (code, signal) => {
                    if (code) {
                        window.showErrorMessage(
                            `Unable to update local repository: ${this.m_WorkDir} to branch or tag: ${this.m_BranchTag}`
                        );
                    }
                    else {
                        window.showInformationMessage(
                            `Local repository: ${this.m_WorkDir} has been updated to branch or tag: ${this.m_BranchTag}`
                        );
                    }

                    // Done
                    resolve();
                    clearInterval(interval);
                })
                .on("error", err => {
                    reject(err);
                });
    
                proc.stdout
                .on("data", (chunk: string | Buffer) => {
                    // Print current updated file to OUTPUT tab
                    store.printToLog(chunk.toString());

                    // Print current updated file to progress bar
                    progressUpdate = chunk.toString('utf8', 0, 50).replace(/[\r\n]/g, '');
                });

                proc.stderr
                .on("data", (chunk: string | Buffer) => {
                    // Print stderr to OUTPUT tab
                    store.printToLog(chunk.toString());
                });
    
            // Kill CVS process to cancel the operation
            token.onCancellationRequested(_ => proc.kill());
        });
    }
}

/*******************************************************************/
/**
 * Exports
 */
export {IUpdater, Updater, SpecificBranchTagUpdater};