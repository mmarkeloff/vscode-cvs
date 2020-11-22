/*******************************************************************/
/**
 * Imports
 */
import {OutputChannel} from 'vscode';

/*******************************************************************/
/**
 * Class for store some runtime info
 */
class Store {
    /** Last commited comment */
    private m_LastComment: string;
    /** OUTPUT tab object */
    private m_Log: OutputChannel;

    /**
     * Create an object
     * @param log OUTPUT tab object
     */
    constructor(log: OutputChannel) {
        this.m_LastComment = '';
        this.m_Log = log;
    }

    /**
     * Set commit comment
     * @param lastComment Commit comment
     */
    setLastComment(lastComment: string) {
        this.m_LastComment = lastComment;
    }

    /**
     * Get last commit comment
     */
    getLastComment(): string {
        return this.m_LastComment;
    }

    /**
     * Print string to OUTPUT tab
     * @param str String
     */
    printToLog(str: string) {
        this.m_Log.appendLine(str);
    }
}

/*******************************************************************/
/**
 * Exports
 */
export default Store;