/*******************************************************************/
/**
 * Imports
 */
import {window} from 'vscode';
import * as fs from 'fs';
import Store from '../store';
import CVS from './cvs';

/*******************************************************************/
/**
 * Interface for add some local object to remote repository
 * @warning Only single object
 */
interface IAdder {
    /** CVSROOT variable */
    m_CVSRoot: string;
    /** Working directory for run CLI CVS client */
    m_WorkDir: string;

    /**
     * Add some local object to remote repository
     * @param store Stores some runtime info
     */
    add(store: Store): void;
}

/*******************************************************************/
/**
 * Class for add selected text file in VS Code explorer to remote repository
 * @warning Only single file
 */
class SelectedTextFileAdder implements IAdder {
    m_CVSRoot: string;
    m_WorkDir: string;
    /** Relative path to selected text file in VS Code explorer */
    m_SelectedFile: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CLI CVS client
     * @param selectedFile Relative path to selected text file in VS Code explorer
     */
    constructor(cvsRoot: string, workDir: string, selectedFile: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_SelectedFile = selectedFile;
    }

    /**
     * Add selected text file in VS Code explorer to remote repository
     * @param store Stores some runtime info
     */
    async add(store: Store) {
        let cvs: CVS = new CVS(this.m_CVSRoot, this.m_WorkDir, store);

        // Waiting for the command to complete
        const code = await cvs.onAddCommon(this.m_SelectedFile);
        if (code) {
            window.showErrorMessage(`Unable to add selected text file to repository: ${this.m_SelectedFile}`);
        }
        else {
            window.showInformationMessage(`Selected text file: ${this.m_SelectedFile} has been added to repository`);
        }
    }
}

/*******************************************************************/
/**
 * Class for add selected binary file in VS Code explorer to remote repository
 * @warning Only single file
 */
class SelectedBinaryFileAdder implements IAdder {
    m_CVSRoot: string;
    m_WorkDir: string;
    /** Relative path to selected binary file in VS Code explorer */
    m_SelectedFile: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CLI CVS client
     * @param selectedFile Relative path to selected binary file in VS Code explorer
     */
    constructor(cvsRoot: string, workDir: string, selectedFile: string) {
        this.m_CVSRoot = cvsRoot;
        this.m_WorkDir = workDir;
        this.m_SelectedFile = selectedFile;
    }

    /**
     * Add selected binary file in VS Code explorer to remote repository
     * @param store Stores some runtime info
     */
    async add(store: Store) {
        let cvs: CVS = new CVS(this.m_CVSRoot, this.m_WorkDir, store);

        // Waiting for the command to complete
        const code = await cvs.onAddBinary(this.m_SelectedFile);
        if (code) {
            window.showErrorMessage(`Unable to add selected binary file: ${this.m_SelectedFile} to repository`);
        }
        else {
            window.showInformationMessage(
                `Selected binary file: ${this.m_SelectedFile} has been added to repository`
            );
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
    /** Relative path to selected directory in VS Code explorer */
    m_SelectedDir: string;

    /**
     * Create an object
     * @param cvsRoot CVSROOT variable
     * @param workDir Working directory for run CLI CVS client
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

        // Waiting for the command to complete
        const code = await cvs.onAddCommon(this.m_SelectedDir);
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
 * Exports
 */
export {IAdder, SelectedTextFileAdder, SelectedBinaryFileAdder, SelectedDirAdder};