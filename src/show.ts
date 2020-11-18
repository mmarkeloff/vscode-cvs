import {window} from 'vscode';
import {spawn} from 'child_process';
import {Store} from './store';

/*******************************************************************/
/**
 * Class for manage local repository
 */
class LocalRepo {
    /**
     * CVSROOT variable
     */
    m_CVSRoot: string;
    /**
     * Local repository directory
     */
    m_RepoDir: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CVS client utility
     */
    constructor(cvsRoot: string, repoDir: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_RepoDir = repoDir;
    }

    /**
     * Show changes in local repository
     * @param store Stores some runtime info
     */
    async showChanges(store: Store) {
        /*
            Stores changes in local repository
        */
        let changes: string = '';

        let proc = spawn(
            'cvs', 
            ['-d', this.m_CVSRoot, '-qn', 'update'], 
            {cwd: this.m_RepoDir})
            .on("close", (code, signal) => {
                if (code) {
                    window.showErrorMessage(`Unable to show changes in local directory: ${this.m_RepoDir}`);
                }
                else {
                    if (changes === '') {
                        changes = `There is no changes in local directory: ${this.m_RepoDir}`;
                    }
                    window.showInformationMessage(`${changes}`, {modal: true});
                }
            })

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
 * Show changes in selected directory
 * @param selectedDir Absolute path to selected directory in VS Code explorer
 * @param cvsRoot CVSROOT variable
 * @param store Stores some runtime info
 */
export async function showChangesSelectedDir(selectedDir: string, cvsRoot: string, store: Store) {
    let localRep: LocalRepo = new LocalRepo(cvsRoot, selectedDir);
    localRep.showChanges(store);
}

