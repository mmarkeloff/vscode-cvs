import {spawn} from 'child_process';
import {Store} from './store';

/*******************************************************************/
/**
 * Class for execute CVS operations
 */
export class CVS {
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
     * Stores some runtime info
     */
    m_Store: Store;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CVS client utility
     * @param store Stores some runtime info
     */
    constructor(cvsRoot: string, workDir: string, store: Store) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_Store = store;
    }

    /**
     * Remove operation
     * @param obj Relative file or directory path
     */
    onRemove(obj: string): Promise<number> {
        let proc = spawn(
            'cvs', 
            ['-d', this.m_CVSRoot, 'remove', obj], 
            {cwd: this.m_WorkDir});

        return new Promise((resolve, reject) => {
            proc.once('exit', (code: number, signal: string) => {
                /*
                    Done
                */
                resolve(code);
            });

            proc.once('error', (err: Error) => {
                reject(err);
            });

            proc.stderr
                .on("data", (chunk: string | Buffer) => {
                    /*
                        Print stderr to OUTPUT tab
                    */
                    this.m_Store.printToLog(chunk as string);
                });
        });
    }

    /**
     * Add text file (or directory) operation
     * @param obj Relative text file or directory path
     */
    onAddText(obj: string): Promise<number> {
        let proc = spawn(
            'cvs', 
            ['-d', this.m_CVSRoot, 'add', obj], 
            {cwd: this.m_WorkDir});

        return new Promise((resolve, reject) => {
            proc.once('exit', (code: number, signal: string) => {
                /*
                    Done
                */
                resolve(code);
            });

            proc.once('error', (err: Error) => {
                reject(err);
            });

            proc.stderr
                .on("data", (chunk: string | Buffer) => {
                    /*
                        Print stderr to OUTPUT tab
                    */
                    this.m_Store.printToLog(chunk as string);
                });
        });
    }

    /**
     * Add binary file operation
     * @param obj Relative binary file path
     */
    onAddBinary(obj: string): Promise<number> {
        let proc = spawn(
            'cvs', 
            ['-d', this.m_CVSRoot, 'add', '-kb', obj], 
            {cwd: this.m_WorkDir});

        return new Promise((resolve, reject) => {
            proc.once('exit', (code: number, signal: string) => {
                /*
                    Done
                */
                resolve(code);
            });

            proc.once('error', (err: Error) => {
                reject(err);
            });

            proc.stderr
                .on("data", (chunk: string | Buffer) => {
                    /*
                        Print stderr to OUTPUT tab
                    */
                    this.m_Store.printToLog(chunk as string);
                });
        });
    }

    /**
     * Commit operation
     * @param obj Relative file or directory path
     */
    onCommit(obj: string, comment: string): Promise<number> {
        let proc = spawn(
            'cvs', 
            ['-d', this.m_CVSRoot, 'commit', '-m', comment, obj], 
            {cwd: this.m_WorkDir});

        return new Promise((resolve, reject) => {
            proc.once('exit', (code: number, signal: string) => {
                /*
                    Done
                */
                if (code === 0) {
                    /*
                        Save current commit comment for future
                    */
                    this.m_Store.setLastComment(comment);
                }
                resolve(code);
            });

            proc.once('error', (err: Error) => {
                reject(err);
            });

            proc.stderr
                .on("data", (chunk: string | Buffer) => {
                    /*
                        Print stderr to OUTPUT tab
                    */
                    this.m_Store.printToLog(chunk as string);
                });
        });
    }
}