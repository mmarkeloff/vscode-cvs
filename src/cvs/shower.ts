/*******************************************************************/
/**
 * Imports
 */
import {window} from 'vscode';
import {spawn} from 'child_process';
import Store from '../store';

/*******************************************************************/
/**
 * Interface for show changes of some object in local repository
 */
interface IShower {
    /** CVSROOT variable */
    m_CVSRoot: string;
    /** Local repository directory */
    m_RepoDir: string;

    /**
     * Show changes of some object in local repository
     * @param store Stores some runtime info
     */
    show(store: Store): void;
}

/*******************************************************************/
/**
 * Class for show changes in base path of local repository
 */
class BasePathShower implements IShower {
    m_CVSRoot: string;
    m_RepoDir: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param repoDir Local repository directory
     */
    constructor(cvsRoot: string, repoDir: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_RepoDir = repoDir;
    }

    /**
     * Show changes in base path of local repository
     * @param store Stores some runtime info
     */
    async show(store: Store) {
        // Stores changes in base path of local repository
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
                    // Collect changes
                    changes += chunk.toString();
                });

            proc.stderr
                .on("data", (chunk: string | Buffer) => {
                    // Print stderr to OUTPUT tab
                    store.printToLog(chunk as string);
                });
    }
}

/*******************************************************************/
/**
 * Exports
 */
export {IShower, BasePathShower};