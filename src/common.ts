import * as vscode from 'vscode';

/*******************************************************************/
/**
 * Move single file
 * @param lhs Source
 * @param rhs Destination
 */
export function mv(lhs: string, rhs: string): Promise<number> {
    const fs = require('fs');
    return new Promise((resolve, reject)  => {
        fs.rename(lhs, rhs, async (err: number) => {
            resolve(err);
        });
    });
}

/*******************************************************************/
/**
 * Show differences between two files
 * @param lhs Left hand side
 * @param rhs Right hand side
 */
export function diff(lhs: string, rhs: string) {
    const lhsUri = vscode.Uri.file(lhs);
    const rhsUri = vscode.Uri.file(rhs);
    return vscode.commands.executeCommand('vscode.diff', lhsUri, rhsUri, 'remote ↔ local');
}