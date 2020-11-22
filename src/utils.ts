/*******************************************************************/
/**
 * Imports
 */
import * as _ from 'lodash';
import * as vscode from 'vscode';
import Store from './store';
import * as Commands from './commands';
import { indexOf } from 'lodash';

/*******************************************************************/
/**
 * Some functions
 */
const Utils = {
    /**
     * Initialize commands
     */
    initCommands(context: vscode.ExtensionContext) {
        // Stores some runtime info
        let store: Store = new Store(vscode.window.createOutputChannel("vscode-cvs"));

        const {commands} = vscode!.extensions!.getExtension('mmarkeloff.vscode-cvs' )!.packageJSON.contributes;
        commands.forEach(({command}: any) => {
            // commit, add, checkout, etc..
            const commandName = _.last(command.split('.')) as string;
            // command callback
            const handler = (Commands as any)[commandName];

            const disposable = vscode.commands.registerCommand(command, (fileUri) => {
                handler(fileUri, store)
            });

            context.subscriptions.push(disposable);

        });

        return Commands;
    },

    file: {
        /**
         * Move single file
         * @param lhs Source
         * @param rhs Destination
         */
        mv(lhs: string, rhs: string): Promise<number> {
            const fs = require('fs');
            return new Promise((resolve, reject)  => {
                fs.rename(lhs, rhs, async (err: number) => {
                    resolve(err);
                });
            });
        }
    },

    folder: {
        /**
         * Get root directory path
         * @param base Base directory path
         */
        getRoot(base?: string) {
            const {workspaceFolders} = vscode.workspace;
            if (!workspaceFolders)
                return;

            const firstRoot = workspaceFolders[0].uri.fsPath;
            if (!base)
                return firstRoot;

            const rootPaths = workspaceFolders.map(folder => folder.uri.fsPath);
            const sortedRootPaths = _.sortBy(rootPaths, [(path: string | any[]) => path.length]).reverse();

            return sortedRootPaths.find((rootPath: string) => base.startsWith(rootPath));
        },

        /**
         * Get selected object path in VS Code explorer
         * @param fileUri Stores path of selected file/directory in VS Code explorer
         */
        getSelected(fileUri: any) {
            return fileUri === undefined ? this.getRoot() : fileUri.fsPath;
        },

        /**
         * Get relative object path 
         * @param fullPath Full object path
         * @param base Base path
         */
        getRelative(fullPath: string, base: string) {
            return fullPath.replace(base + '/', '');
        }
    },

    config: {
        /**
         * Get vscode.cvs.CVSROOT variable
         */
        getCVSRoot() {
            return vscode.workspace.getConfiguration('vscode-cvs').get('CVSROOT');
        }
    }
};

/*******************************************************************/
/**
 * Exports
 */
export default Utils;