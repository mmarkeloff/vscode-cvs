import {window} from 'vscode';
import {Store} from './store';
import {CVS} from './cvs';

/*******************************************************************/
/**
 * Interface for add some local object to remote repository
 */
interface IAdder {
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
     * Add some local object to remote repository
     * @param store Stores some runtime info
     */
    add(store: Store): void;
}

/*******************************************************************/
/**
 * Class for add opened text file in current VS Code window to remote repository
 */
class OpenedTextFileAdder implements IAdder {
    m_CVSRoot: string;
    m_WorkDir: string;

    /**
     * Relative path to opened text file in current VS Code window
     */
    m_OpenedFile: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run cvs client utility
     * @param openedFile Relative path to opened text file in current VS Code window
     */
    constructor(cvsRoot: string, workDir: string, openedFile: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_OpenedFile = openedFile;
    }

    /**
     * Add opened text file in current VS Code window to remote repository
     * @param store Stores some runtime info
     */
    async add(store: Store) {
        let cvs: CVS = new CVS(this.m_CVSRoot, this.m_WorkDir, store);

        /*
            Waiting for the command to complete
        */
        const code = await cvs.onAddText(this.m_OpenedFile);
        if (code) {
            window.showErrorMessage(`Unable to add opened text file in current window: ${this.m_OpenedFile}`);
        }
        else {
            window.showInformationMessage(`Opened text file in current window: ${this.m_OpenedFile} has been added`);
        }
    }
}

/*******************************************************************/
/**
 * Class for add opened binary file in current VS Code window to remote repository
 */
class OpenedBinaryFileAdder implements IAdder {
    m_CVSRoot: string;
    m_WorkDir: string;

    /**
     * Relative path to opened binary file in current VS Code window
     */
    m_OpenedFile: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run cvs client utility
     * @param openedFile Relative path to opened binary file in current VS Code window
     */
    constructor(cvsRoot: string, workDir: string, openedFile: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_OpenedFile = openedFile;
    }

    /**
     * Add opened binary file in current VS Code window to remote repository
     * @param store Stores some runtime info
     */
    async add(store: Store) {
        let cvs: CVS = new CVS(this.m_CVSRoot, this.m_WorkDir, store);

        /*
            Waiting for the command to complete
        */
        const code = await cvs.onAddText(this.m_OpenedFile);
        if (code) {
            window.showErrorMessage(`Unable to add opened binary file in current window: ${this.m_OpenedFile}`);
        }
        else {
            window.showInformationMessage(`Opened binary file in current window: ${this.m_OpenedFile} has been added`);
        }
    }
}

/*******************************************************************/
/**
 * Class for add selected directory in VS Code explorer to remote repository
 * @warning Only single directory
 */
class SelectedDirAdder implements IAdder {
    m_CVSRoot: string;
    m_WorkDir: string;

    /**
     * Relative path to selected directory in VS Code explorer
     */
    m_SelectedDir: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run cvs client utility
     * @param selectedDir Relative path to selected directory in VS Code explorer
     */
    constructor(cvsRoot: string, workDir: string, selectedDir: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_SelectedDir = selectedDir;
    }

    /**
     * Add selected directory in VS Code explorer to remote repository
     * @param store Stores some runtime info
     */
    async add(store: Store) {
        let cvs: CVS = new CVS(this.m_CVSRoot, this.m_WorkDir, store);

        /*
            Waiting for the command to complete
        */
        const code = await cvs.onAddText(this.m_SelectedDir);
        if (code) {
            window.showErrorMessage(`Unable to add local directory: ${this.m_SelectedDir} to repository`);
        }
        else {
            window.showInformationMessage(`Local directory: ${this.m_SelectedDir} has been added to repository`);
        }
    }
}

/*******************************************************************/
/**
 * Add opened file in current VS Code window to remote repository
 * @param openedFile Absolute path to opened file in current VS Code window 
 * @param workDir Working directory for run cvs client utility
 * @param cvsRoot CVSROOT variable
 * @param store Stores some runtime info
 */
export async function addOpenedFile(openedFile: string, workDir: string, cvsRoot: string, store: Store) {
    /*
        Make relative path to opened file in current VS Code window
        Example: openedFile='/a/b/c/d.txt' + workDir='/a/b' => file='c/d.txt'
    */
    const file = openedFile.replace(workDir + '/', '');

    window.showInformationMessage(`Select file type`);
    const choice = await window.showQuickPick(
        ['text', 'binary'], 
        {placeHolder: 'text or binary'}
    );

    let adder: IAdder
    if (choice === 'text') {
        adder = new OpenedTextFileAdder(cvsRoot, workDir, file);
    }
    else {
        adder = new OpenedBinaryFileAdder(cvsRoot, workDir, file);
    }
    adder.add(store);
}

/*******************************************************************/
/**
 * Add selected directory in VS Code explorer to remote repository
 * @param selectedDir Absolute path to selected directory in VS Code explorer
 * @param workDir Working directory for run cvs client utility
 * @param cvsRoot CVSROOT variable
 * @param store Stores some runtime info
 */
export async function addSelectedDir(selectedDir: string, workDir: string, cvsRoot: string, store: Store) {
    /*
        Make relative path to selected directory in VS Code explorer
        Example: selectedDir='/a/b/c' + workDir='/a' => dir='b/c'
    */
    const dir = selectedDir.replace(workDir + '/', '');

    let adder: IAdder = new SelectedDirAdder(cvsRoot, workDir, dir);
    adder.add(store);
}