/*******************************************************************/
/**
 * Imports
 */
import {window, CancellationToken, Progress} from 'vscode';
import {spawn} from 'child_process';
import Store from './store';

/*******************************************************************/
/**
 * Interface for checkout some object from remote repository
 */
interface ICheckouter {
    /** CVSROOT variable */
    m_CVSRoot: string;
    /** Working directory for run CLI CVS client */
    m_WorkDir: string;

    /**
     * Checkout some object from remote repository
     * @param store Stores some runtime info
     */
    checkout(
        progress: Progress<{message?: string; increment?: number}>, 
        token: CancellationToken, 
        store: Store
    ): Promise<void>;
}

/*******************************************************************/
/**
 * Class for checkout CVS module
 */
class ModuleCheckouter implements ICheckouter {
    m_CVSRoot: string;
    m_WorkDir: string;
    /** CVS module name */
    m_ModuleName: string;
    /** Branch or tag */
    m_BranchTag: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CLI CVS client
     * @param moduleName CVS module name
     * @param branchTag Branch or tag
     */
    constructor(cvsRoot: string, workDir: string, moduleName: string, branchTag: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_ModuleName = moduleName;
        this.m_BranchTag = branchTag;
    }

    /**
     * Checkout CVS module
     * @param progress For progress bar
     * @param token For cancel operation
     * @param store Stores some runtime info
     */
    checkout(
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
                ['-d', this.m_CVSRoot, 'checkout', '-r', this.m_BranchTag, this.m_ModuleName], 
                {cwd: this.m_WorkDir})
                .on("close", (code, signal) => {
                    if (code) {
                        window.showErrorMessage(`Unable to checkout module: ${this.m_ModuleName}`);
                    }
                    else {
                        window.showInformationMessage(`Module: ${this.m_ModuleName} has been checkouted`);
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
                    // Print current checkouted file to OUTPUT tab
                    store.printToLog(chunk.toString());

                    // Print current checkouted file to progress bar
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
export {ICheckouter, ModuleCheckouter};