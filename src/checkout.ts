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
 * Interface for chechout module from repository
 */
interface ICheckout {
    m_CVSRoot: string; ///< CVSROOT
    m_WorkDir: string; ///< working dir

    checkout(
        progress: Progress<{message?: string; increment?: number}>, 
        token: CancellationToken, 
        vdb: ExtensionVDB,
        logger: ExtensionChannel
    ): Promise<void>;
}

////////////////////////////////////////////////////////////////////
/**
 * Class for checkout module from repository
 */
class CheckoutModule implements ICheckout {
    m_CVSRoot: string;
    m_WorkDir: string;
    m_ModuleName: string; ///< module name
    m_BranchTag: string; ///< branch/tag

    /**
     * Constructor
     * @param cvs_root CVSROOT
     * @param work_dir working dir
     * @param module_name module name
     * @param branch_tag branch/tag
     */
    constructor(cvs_root: string, work_dir: string, module_name: string, branch_tag: string) {
        this.m_CVSRoot = cvs_root;
        this.m_WorkDir = work_dir;
        this.m_ModuleName = module_name;
        this.m_BranchTag = branch_tag;
    }

    checkout(
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
                ['-d', this.m_CVSRoot, 'checkout', '-r', this.m_BranchTag, this.m_ModuleName], 
                {cwd: this.m_WorkDir})
                .on("close", (code, signal) => {
                    if (code) {
                        new ErrorMessage(`Unable to checkout module: ${this.m_ModuleName} from repository`).show();
                    }
                    else {
                        new InfoMessage(`Module: ${this.m_ModuleName} has been checkouted from repository`).show();
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
export {ICheckout, CheckoutModule};