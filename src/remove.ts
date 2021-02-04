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
 * Interface for remove file from repository
 */
interface IRemove {
    m_CVSRoot: string; ///< CVSROOT
    m_WorkDir: string; ///< working dir

    remove(vdb: ExtensionVDB, logger: ExtensionChannel): void;
}

////////////////////////////////////////////////////////////////////
/**
 * Class for remove selected file from repository
 */
class RemoveSelectedFile implements IRemove {
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

    async remove(vdb: ExtensionVDB, logger: ExtensionChannel) {
        const cvs = new CVS(this.m_CVSRoot, this.m_WorkDir, vdb, logger);

        const code = await cvs.onRemove(this.m_FilePath);
        if (code) {
            return new ErrorMessage(`Unable to remove selected file: ${this.m_FilePath} from repository`).show();
        }
        else {
            return new InfoMessage(`Selected file: ${this.m_FilePath} has been removed from repository`).show();
        }
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export {IRemove, RemoveSelectedFile};