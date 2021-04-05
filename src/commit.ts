////////////////////////////////////////////////////////////////////
/**
 * Imports
 */
import CVS from './cvs';
import ExtensionVDB from './vdb';
import {ExtensionChannel} from './log';
import {ErrorMessage, InfoMessage} from './messages';

////////////////////////////////////////////////////////////////////
/**
 * Interface for commit to repository
 */
interface ICommit {
    m_CVSRoot: string; ///< CVSROOT
    m_WorkDir: string; ///< working dir
    m_Comment: string; ///< commit comment

    commit(vdb: ExtensionVDB, logger: ExtensionChannel) : void;
}

////////////////////////////////////////////////////////////////////
/**
 * Class for commit opened file in current VS Code window to repository
 */
class CommitOpenedFile implements ICommit {
    m_CVSRoot: string;
    m_WorkDir: string;
    m_Comment: string;
    m_OpenedFilePath: string; ///< file path

    /**
     * Constructor
     * @param cvs_root CVSROOT
     * @param work_dir working dir
     * @param comment commit comment
     * @param opened_file_path file path
     */
    constructor(cvs_root: string, work_dir: string, comment: string, opened_file_path: string) {
        this.m_CVSRoot = cvs_root;
        this.m_WorkDir = work_dir;
        this.m_Comment = comment;
        this.m_OpenedFilePath = opened_file_path;
    }

    async commit(vdb: ExtensionVDB, logger: ExtensionChannel) {
        const cvs = new CVS(this.m_CVSRoot, this.m_WorkDir, vdb, logger);

        const code = await cvs.onCommit([this.m_OpenedFilePath], this.m_Comment);
        if (code) {
            return new ErrorMessage(
                `Unable to commit opened file in current window: ${this.m_OpenedFilePath} to repository`
            ).show();
        }
        else {
            return new InfoMessage(
                `Opened file in current window: ${this.m_OpenedFilePath} has been commited to repository`
            ).show();
        }
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Class for commit content to repository
 */
class CommitContent implements ICommit {
    m_CVSRoot: string;
    m_WorkDir: string;
    m_Comment: string;
    m_FilePaths: string[]; ///< file paths

    /**
     * Constructor
     * @param cvs_root CVSROOT
     * @param work_dir working dir
     * @param comment commit comment
     * @param file_paths file paths
     */
    constructor(cvs_root: string, work_dir: string, comment: string, file_paths: string[]) {
        this.m_CVSRoot = cvs_root;
        this.m_WorkDir = work_dir;
        this.m_Comment = comment;
        this.m_FilePaths = file_paths;
    }

    async commit(vdb: ExtensionVDB, logger: ExtensionChannel) {
        const cvs = new CVS(this.m_CVSRoot, this.m_WorkDir, vdb, logger);
        if (this.m_FilePaths.length > 0) {
            const code = await cvs.onCommit(this.m_FilePaths, this.m_Comment);
            if (code) {
                new ErrorMessage(`Unable to commit selected files: "${this.m_FilePaths.join(" ")}" to repository`).show();
            }
            else {
                new InfoMessage(`Selected files: "${this.m_FilePaths.join(" ")}" have been commited to repository`).show();
            }
        }
        else {
            new ErrorMessage(`No files have been selected to be committed`).show();
        }
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export {ICommit, CommitOpenedFile, CommitContent};