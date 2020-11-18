import {window, ProgressLocation, CancellationToken, Progress} from 'vscode';
import {spawn} from 'child_process';
import {Store} from './store';

/*******************************************************************/
/**
 * Class for checkout some CVS module
 */
class Checkouter {
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
     * CVS module name
     */
    m_ModuleName: string;
    /**
     * Branch or tag
     */
    m_Branch: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CVS client utility
     * @param moduleName CVS module name
     * @param branch Branch or tag
     */
    constructor(cvsRoot: string, workDir: string, moduleName: string, branch: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_ModuleName = moduleName;
        this.m_Branch = branch;
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
            /*
                Cancel the operation
            */
            if (token.isCancellationRequested) {
                return;
            }
    
            let progressUpdate = 'starting up...';
            const interval = setInterval(() => progress.report({message: progressUpdate}), 500);
    
            let proc = spawn(
                'cvs', 
                ['-d', this.m_CVSRoot, 'checkout', '-r', this.m_Branch, this.m_ModuleName], 
                {cwd: this.m_WorkDir})
                .on("close", (code, signal) => {
                    if (code) {
                        window.showErrorMessage(`Unable to checkout module: ${this.m_ModuleName}`);
                    }
                    else {
                        window.showInformationMessage(`Module: ${this.m_ModuleName} has been checkouted`);
                    }

                    /*
                        Done
                    */
                    resolve();
                    clearInterval(interval);
                })
                .on("error", err => {
                    reject(err);
                });
    
                proc.stdout
                .on("data", (chunk: string | Buffer) => {
                    /*
                        Print current checkouted file to OUTPUT tab
                    */
                    store.printToLog(chunk.toString());

                    /*
                        Print current checkouted file to progress bar
                    */
                    progressUpdate = chunk.toString('utf8', 0, 50).replace(/[\r\n]/g, '');
                });

                proc.stderr
                .on("data", (chunk: string | Buffer) => {
                    /*
                        Print stderr to OUTPUT tab
                    */
                    store.printToLog(chunk.toString());
                });
    
            /*
                Kill CVS process to cancel the operation
            */
            token.onCancellationRequested(_ => proc.kill());
        });
    }
}

/*******************************************************************/
/**
 * Checkout CVS module
 * @param selectedDir Absolute path to selected directory in VS Code explorer
 * @param cvsRoot CVSROOT variable
 * @param store Stores some runtime info
 */
export async function checkoutModule(selectedDir: string, cvsRoot: string, store: Store) {
	const moduleName = await window.showInputBox({
		value: store.getLastComment(),
        placeHolder: 'Input module name here',
        validateInput: text => {
			return text === '' ? 'Please input module name' : null;
		}
    });

    if (moduleName !== undefined) {
        const branch = await window.showInputBox({
            value: store.getLastComment(),
            placeHolder: 'Input branch or tag here',
            validateInput: text => {
                return text === '' ? 'Please input branch or tag' : null;
            }
        });

        if (branch !== undefined) {
            window.withProgress({
                location: ProgressLocation.Notification,
                title: "CVS checkout",
                cancellable: true
            }, async (progress, token) => {
                let checkouter: Checkouter = new Checkouter(cvsRoot, selectedDir, moduleName, branch);
                return checkouter.checkout(progress, token, store);
            });
        }
    }
}