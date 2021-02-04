////////////////////////////////////////////////////////////////////
/**
 * Imports
 */
import CVS from './cvs';
import ExtensionVDB from './vdb';
import { ExtensionChannel } from './log';
import Utils from './utils';
import {ErrorMessage, ModalInfoMessage} from './messages';

////////////////////////////////////////////////////////////////////
/**
 * Interface for show changes in local repository
 */
interface IShowChanges {
    m_CVSRoot: string; ///< CVSROOT
    m_RepoDir: string; ///< local repository dir

    show(vdb: ExtensionVDB, logger: ExtensionChannel): void;
}

////////////////////////////////////////////////////////////////////
/**
 * Class for show changes in local repository
 */
class ShowChanges implements IShowChanges {
    m_CVSRoot: string;
    m_RepoDir: string;

    /**
     * Constructor
     * @param cvs_root CVSROOT
     * @param repo_dir local repository dir
     */
    constructor(cvs_root: string, repo_dir: string) {
        this.m_CVSRoot = cvs_root;
        this.m_RepoDir = repo_dir;
    }

    async show(vdb: ExtensionVDB, logger: ExtensionChannel) {
        const cvs = new CVS(this.m_CVSRoot, this.m_RepoDir, vdb, logger);

        const res = await cvs.onGetChanges();
        if (res[0]) {
            new ErrorMessage(`Unable to show changes in local copy of repository: ${this.m_RepoDir}`).show();
        }
        else {
            if (res[1]) {
                let changes = '';
                const collect = (files: string[], head: string) => {
                    if (files.length) {
                        if (changes.length)
                            changes += '\n';

                        changes += head + ':' + '\n';
                        for (const file of files)
                            changes += '    ' + file + '\n';
                    }
                };

                collect(Utils.File.getModified(res[1]), 'Modified');
                collect(Utils.File.getAdded(res[1]), 'Added');
                collect(Utils.File.getRemoved(res[1]), 'Removed');
                collect(Utils.File.getUncontrolled(res[1]), 'Uncontrolled');
                collect(Utils.File.getUpdated(res[1]), 'Updated');

                new ModalInfoMessage(`${changes}`).show();
            }
            else {
                new ModalInfoMessage(`There is no changes in local copy of repository: ${this.m_RepoDir}`).show();
            }
        }

    }
}

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export {IShowChanges, ShowChanges};