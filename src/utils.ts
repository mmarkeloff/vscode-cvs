////////////////////////////////////////////////////////////////////
/**
 * Imports
 */
import * as vscode from 'vscode';
import * as _ from 'lodash';
import * as fs from 'fs';

import ExtensionVDB from './vdb';
import {ExtensionChannel} from './log';
import * as Commands from './commands';

////////////////////////////////////////////////////////////////////
/**
 * Utilities
 */
const Utils = {
    init_commands(context: vscode.ExtensionContext) {
        const logger = new ExtensionChannel(vscode.window.createOutputChannel("CodeCVS"));
        const vdb = new ExtensionVDB();

        const {commands} = vscode!.extensions!.getExtension('mmarkeloff.vscode-cvs')!.packageJSON.contributes;
        commands.forEach(({command}: any) => {
            const commandName = _.last(command.split('.')) as string;

            const handler = (Commands as any)[commandName];
            const disposable = vscode.commands.registerCommand(command, (fileUri) => {
                handler(fileUri, vdb, logger)
            });

            context.subscriptions.push(disposable);
        });

        return Commands;
    },

    /**
     * Extension utilities
     */
    Extension: {
        get_cvs_root() {
            return vscode.workspace.getConfiguration('CodeCVS').get('CVSROOT');
        },

        is_add_as_binary() {
            const addAsBinary = vscode.workspace.getConfiguration('CodeCVS').get('add_as_binary');
            if (!addAsBinary || 0 == addAsBinary)
                return false;
            
            return true;
        }
    },

    /**
     * File utilities
     */
    File: {
        mv(lhs: string, rhs: string): Promise<number> {
            const fs = require('fs');
            return new Promise((resolve, reject)  => {
                fs.rename(lhs, rhs, async (err: number) => {
                    resolve(err);
                });
            });
        },

        is_file(file_path: string) {
            try {
                const stat = fs.lstatSync(file_path);
                return stat.isFile();
            } catch (e) {
                return false;
            }
        },

        getModified(files: string) {
            return files.split('\n').filter(file => file.startsWith('M ')).map(file => file.slice(2));
        },

        getAdded(files: string) {
            return files.split('\n').filter(file => file.startsWith('A ')).map(file => file.slice(2));
        },

        getRemoved(files: string) {
            return files.split('\n').filter(file => file.startsWith('R ')).map(file => file.slice(2));
        },

        getUncontrolled(files: string) {
            return files.split('\n').filter(file => file.startsWith('? ')).map(file => file.slice(2));
        },

        getUpdated(files: string) {
            return files.split('\n').filter(file => file.startsWith('U ')).map(file => file.slice(2));
        }
    },

    /**
     * Folder utilities
     */
    Path: {
        get_root_path(base_path?: string) {
            const {workspaceFolders} = vscode.workspace;
            if (!workspaceFolders)
                return;

            const firstRoot = workspaceFolders[0].uri.fsPath;
            if (!base_path)
                return firstRoot;

            const rootPaths = workspaceFolders.map(folder => folder.uri.fsPath);
            const sortedRootPaths = _.sortBy(rootPaths, [(path: string | any[]) => path.length]).reverse();

            return sortedRootPaths.find((rootPath: string) => base_path.startsWith(rootPath));
        },

        get_selected(file_uri: any) {
            return file_uri === undefined ? this.get_root_path() : file_uri.fsPath;
        },

        get_relative(full_path: string, base_path: string) {
            const path = require('path')
            return full_path.replace(base_path + path.sep, '');
        }
    }
};

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export default Utils;