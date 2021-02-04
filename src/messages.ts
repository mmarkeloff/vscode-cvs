////////////////////////////////////////////////////////////////////
/**
 * Imports
 */
import * as vscode from 'vscode';

////////////////////////////////////////////////////////////////////
/**
 * Messages
 */
export const CVSROOT_ERROR = 'Unable to get vscode-cvs.CVSROOT variable';
export const COMPARE_ERROR = 'You cannot compare an unopened or unsaved file';

////////////////////////////////////////////////////////////////////
/**
 * Interface for handle message
 */
interface IMessage {
    m_Text: string; ///< message text

    show(): Thenable<string | undefined> ;
}

////////////////////////////////////////////////////////////////////
/**
 * Class for handle error message
 */
class ErrorMessage implements IMessage {
    m_Text: string;

    /**
     * Constructor
     * @param text message text
     */
    constructor(text: string) {
        this.m_Text = text;
    }

    async show() {
        return vscode.window.showErrorMessage(this.m_Text);
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Class for handle info message
 */
class InfoMessage implements IMessage {
    m_Text: string;

    /**
     * Constructor
     * @param text message text
     */
    constructor(text: string) {
        this.m_Text = text;
    }

    async show() {
        return vscode.window.showInformationMessage(this.m_Text);
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Class for handle modal info message
 */
class ModalInfoMessage implements IMessage {
    m_Text: string;

    /**
     * Constructor
     * @param text message text
     */
    constructor(text: string) {
        this.m_Text = text;
    }

    async show() {
        return vscode.window.showInformationMessage(this.m_Text, {modal: true});
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export {IMessage, ErrorMessage, InfoMessage, ModalInfoMessage};