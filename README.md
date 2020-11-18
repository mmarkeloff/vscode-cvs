<h1 align="center">
Visual Studio Code extension for vscode-cvs
</h1>

This is the Visual Studio Code extension to use CVS.

## Features

Commands available via the Command Palette:
* CodeCVS: commit opened file in current window
* CodeCVS: smart commit from local directory
* CodeCVS: add opened file in current window
* CodeCVS: add local directory to repository
* CodeCVS: show changes in local directory
* CodeCVS: checkout ...

Commands available via the `explorer` contextual menu:
* CodeCVS: smart commit from local directory
* CodeCVS: add local directory to repository
* CodeCVS: show changes in local directory
* CodeCVS: checkout ...

## Requirements

* [CVS client utility](https://www.gnu.org/software/trans-coord/manual/cvs/cvs.html) should be accessible in the PATH
* Visual Studio Code v1.51.0

## Extension Settings

vscode-cvs extension contributes the following settings:

* `vs-code.CVSROOT`: CVSROOT variable for passing it to [CVS client utility](https://www.gnu.org/software/trans-coord/manual/cvs/cvs.html) 

## Release Notes

### 0.0.1

Initial release of vscode-cvs
