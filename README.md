<h1 align="center">
Visual Studio Code extension for CVS support
</h1>

This is the Visual Studio Code extension to use CVS.

## Features

Commands available via the `Command Palette`:
* `CodeCVS: commit`
* `CodeCVS: smart commit from local directory`
* `CodeCVS: show changes in local directory`
* `CodeCVS: checkout ...`
* `CodeCVS: compare`
* `CodeCVS: update`

Commands available via the `explorer` contextual menu:
* `CodeCVS: smart commit from local directory`
* `CodeCVS: add`
* `CodeCVS: show changes in local directory`
* `CodeCVS: checkout ...`
* `CodeCVS: update`

## CodeCVS: commit

![](resources/commit_demo.gif)

## CodeCVS: compare

![](resources/compare_demo.gif)

## Requirements

* CLI CVS client ([Windows](https://ftp.gnu.org/non-gnu/cvs/binary/stable/x86-woe/), [MacOS](https://formulae.brew.sh/formula/cvs)) should be accessible in the PATH
* Visual Studio Code v1.51.0

## Extension Settings

vscode-cvs extension contributes the following settings:

* `vscode-cvs.CVSROOT`: [CVSROOT](https://wiki.gentoo.org/wiki/CVS/Tutorial#The_CVSROOT) variable
