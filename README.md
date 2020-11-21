<h1 align="center">
Visual Studio Code extension for CVS support
</h1>

This is the Visual Studio Code extension to use CVS.

## Features

Commands available via the `Command Palette`:
* `CodeCVS: commit`
* `CodeCVS: smart commit from local directory`
* `CodeCVS: add opened file in current window`
* `CodeCVS: add local directory to repository`
* `CodeCVS: show changes in local directory`
* `CodeCVS: checkout ...`
* `CodeCVS: compare`

Commands available via the `explorer` contextual menu:
* `CodeCVS: smart commit from local directory`
* `CodeCVS: add local directory to repository`
* `CodeCVS: show changes in local directory`
* `CodeCVS: checkout ...`

## CodeCVS: smart commit from local directory

Command allows:
* remove locally removed files and directories from the remote CVS repository
* add locally added files and directories to the remote CVS repository
* commit all contributed changes

`CodeCVS: smart commit from local directory` command will do exactly what `CodeCVS: show changes in local directory` command shows

## Requirements

* CLI CVS client ([Windows](https://ftp.gnu.org/non-gnu/cvs/binary/stable/x86-woe/), [MacOS](https://formulae.brew.sh/formula/cvs)) should be accessible in the PATH
* Visual Studio Code v1.51.0

## Extension Settings

vscode-cvs extension contributes the following settings:

* `vscode-cvs.CVSROOT`: [CVSROOT](https://wiki.gentoo.org/wiki/CVS/Tutorial#The_CVSROOT) variable
