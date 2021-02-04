////////////////////////////////////////////////////////////////////
/**
 * Imports
 */

import CVS from './cvs';
import ExtensionVDB from './vdb';
import { ExtensionChannel } from './log';
import {ErrorMessage, InfoMessage} from './messages';

////////////////////////////////////////////////////////////////////
/**
 * Interface for add file/path to repository
 */
interface IAdd {
    m_CVSRoot: string; ///< CVSROOT
    m_WorkDir: string; ///< working dir

    add(vdb: ExtensionVDB, logger: ExtensionChannel): void;
}

////////////////////////////////////////////////////////////////////
/**
 * Class for add selected file as text to repository
 */
class AddSelectedTextFile implements IAdd {
    m_CVSRoot: string;
    m_WorkDir: string;
    m_FilePath: string; ///< file path

    /**
     * Constructor
     * @param cvs_root CVSROOT
     * @param work_dir working dir
     * @param file_path file path
     */
    constructor(cvs_root: string, work_dir: string, file_path: string) {
        this.m_CVSRoot = cvs_root;
        this.m_WorkDir = work_dir;
        this.m_FilePath = file_path;
    }

    async add(vdb: ExtensionVDB, logger: ExtensionChannel) {
        const cvs = new CVS(this.m_CVSRoot, this.m_WorkDir, vdb, logger);

        const code = await cvs.onAddCommon(this.m_FilePath);
        if (code) {
            return new ErrorMessage(`Unable to add selected text file: ${this.m_FilePath} to repository`).show();
        }
        else {
            return new InfoMessage(`Selected text file: ${this.m_FilePath} has been added to repository`).show();
        }
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Class for add selected file as binary to repository
 */
class AddSelectedBinaryFile implements IAdd {
    m_CVSRoot: string;
    m_WorkDir: string;
    m_FilePath: string; ///< file path

    /**
     * Constructor
     * @param cvs_root CVSROOT
     * @param work_dir working dir
     * @param file_path file path
     */
    constructor(cvs_root: string, work_dir: string, file_path: string) {
        this.m_CVSRoot = cvs_root;
        this.m_WorkDir = work_dir;
        this.m_FilePath = file_path;
    }

    async add(vdb: ExtensionVDB, logger: ExtensionChannel) {
        const cvs = new CVS(this.m_CVSRoot, this.m_WorkDir, vdb, logger);

        const code = await cvs.onAddBinary(this.m_FilePath);
        if (code) {
            return new ErrorMessage(`Unable to add selected binary file: ${this.m_FilePath} to repository`).show();
        }
        else {
            return new InfoMessage(`Selected binary file: ${this.m_FilePath} has been added to repository`).show();
        }
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Class for add selected dir to repository
 */
class AddSelectedDir implements IAdd {
    m_CVSRoot: string;
    m_WorkDir: string;
    m_Dir: string; ///< dir path

    /**
     * Constructor
     * @param cvs_root CVSROOT
     * @param work_dir working dir
     * @param dir dir path
     */
    constructor(cvs_root: string, work_dir: string, dir: string) {
        this.m_CVSRoot = cvs_root;
        this.m_WorkDir = work_dir;
        this.m_Dir= dir;
    }

    async add(vdb: ExtensionVDB, logger: ExtensionChannel) {
        const cvs = new CVS(this.m_CVSRoot, this.m_WorkDir, vdb, logger);

        const code = await cvs.onAddCommon(this.m_Dir);
        if (code) {
            return new ErrorMessage(`Unable to add local directory: ${this.m_Dir} to repository`).show();
        }
        else {
            return new InfoMessage(`Local directory: ${this.m_Dir} has been added to repository`).show();
        }
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export {IAdd, AddSelectedTextFile, AddSelectedBinaryFile, AddSelectedDir};