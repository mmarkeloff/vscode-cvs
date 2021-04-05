////////////////////////////////////////////////////////////////////
/**
 * Imports
 */
import {spawn} from 'child_process';

import ExtensionVDB from './vdb';
import {ExtensionChannel} from './log';

////////////////////////////////////////////////////////////////////
/**
 * Class for manage CLI CVS client
 */
class CVS {
    m_CVSRoot: string; ///< CVSROOT
    m_WorkDir: string; ///< working dir
    m_VDB: ExtensionVDB; ///< extension virtual database
    m_Logger: ExtensionChannel; ///< extension log

    /**
     * Constructor
     * @param cvs_root CVSROOT
     * @param work_dir working dir
     * @param vdb extension virtual database
     * @param logger extension log
     */
    constructor(cvs_root: string, work_dir: string, vdb: ExtensionVDB, logger: ExtensionChannel) {
        this.m_CVSRoot = cvs_root;
        this.m_WorkDir = work_dir;
        this.m_VDB = vdb;
        this.m_Logger = logger;
    }

    onRemove(path: string): Promise<number> {
        const proc = spawn(
            'cvs', 
            ['-d', this.m_CVSRoot, 'remove', path], 
            {cwd: this.m_WorkDir}
        );

        return new Promise((resolve, reject) => {
            proc.once('exit', (code: number, signal: string) => {
                resolve(code);
            });

            proc.once('error', (err: Error) => {
                reject(err);
            });

            proc.stderr
            .on("data", (chunk: string | Buffer) => {
                this.m_Logger.print(chunk as string);
            });
        });
    }

    onAddCommon(path: string): Promise<number> {
        const proc = spawn(
            'cvs', 
            ['-d', this.m_CVSRoot, 'add', path], 
            {cwd: this.m_WorkDir}
        );

        return new Promise((resolve, reject) => {
            proc.once('exit', (code: number, signal: string) => {
                resolve(code);
            });

            proc.once('error', (err: Error) => {
                reject(err);
            });

            proc.stderr
            .on("data", (chunk: string | Buffer) => {
                this.m_Logger.print(chunk as string);
            });
        });
    }

    onAddBinary(path: string): Promise<number> {
        const proc = spawn(
            'cvs', 
            ['-d', this.m_CVSRoot, 'add', '-kb', path], 
            {cwd: this.m_WorkDir}
        );

        return new Promise((resolve, reject) => {
            proc.once('exit', (code: number, signal: string) => {
                resolve(code);
            });

            proc.once('error', (err: Error) => {
                reject(err);
            });

            proc.stderr
            .on("data", (chunk: string | Buffer) => {
                this.m_Logger.print(chunk as string);
            });
        });
    }

    onCommit(paths: string[], comment: string): Promise<number> {
        const proc = spawn(
            'cvs', 
            ['-d', this.m_CVSRoot, 'commit', '-m', comment].concat(paths), 
            {cwd: this.m_WorkDir}
        );

        return new Promise((resolve, reject) => {
            proc.once('exit', (code: number, signal: string) => {
                if (code === 0) {
                    this.m_VDB.setLastComment(comment);
                }
                resolve(code);
            });

            proc.once('error', (err: Error) => {
                reject(err);
            });

            proc.stderr
            .on("data", (chunk: string | Buffer) => {
                this.m_Logger.print(chunk as string);
            });
        });
    }

    onUpdateSingleFile(path: string): Promise<number> {
        const proc = spawn(
            'cvs', 
            ['-d', this.m_CVSRoot, 'update', path], 
            {cwd: this.m_WorkDir}
        );

        return new Promise((resolve, reject) => {
            proc.once('exit', (code: number, signal: string) => {
                resolve(code);
            });

            proc.once('error', (err: Error) => {
                reject(err);
            });

            proc.stderr
            .on("data", (chunk: string | Buffer) => {
                this.m_Logger.print(chunk as string);
            });
        });
    }

    onGetChanges(): Promise<[number, string | undefined]> {
        const proc = spawn(
            'cvs', 
            ['-d', this.m_CVSRoot, '-qn', 'update'], 
            {cwd: this.m_WorkDir}
        );

        return new Promise((resolve, reject) => {
            let changes = '';

            proc.once('exit', (code: number, signal: string) => {
                if (changes.length) {
                    resolve([code, changes]);
                }
                else {
                    resolve([code, undefined]);
                }
            });

            proc.once('error', (err: Error) => {
                reject(err);
            });

            proc.stdout
            .on("data", (chunk: string | Buffer) => {
                changes += chunk.toString().replace(/[\r\n]/g, '\n');
            });

            proc.stderr
            .on("data", (chunk: string | Buffer) => {
                this.m_Logger.print(chunk as string);
            });
        });
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export default CVS;