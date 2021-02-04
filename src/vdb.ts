////////////////////////////////////////////////////////////////////
/**
 * Extension virtual database
 */
class ExtensionVDB {
    private m_LastComment: string; ///< last commited comment

    /**
     * Constructor
     */
    constructor() {
        this.m_LastComment = '';
    }

    /**
     * Set last commited comment
     * @param comment comment
     */
    async setLastComment(comment: string) {
        this.m_LastComment = comment;
    }

    /**
     * Get last commited comment
     */
    getLastComment(): string {
        return this.m_LastComment;
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export default ExtensionVDB;