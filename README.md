<h1 align="center">
Visual Studio Code extension for CVS support
</h1>

This is the Visual Studio Code extension to use CVS.

## Setting up

![](resources/setting_up.gif)

## Features

## CodeCVS: commit

![](resources/commit_demo.gif)

## CodeCVS: compare

![](resources/compare_demo.gif)

## CodeCVS: changes

![](resources/show_demo.gif)

## CodeCVS: add

![](resources/add_demo.gif)

## CodeCVS: commit content

![](resources/commit_content_demo.gif)

## Output

`CodeCVS` extension duplicates stderr of the CLI CVS client to the OUTPUT tab. To see CVS errors, select `vscode-cvs` from the contextual menu.

## Requirements

* CLI CVS client ([Windows](https://ftp.gnu.org/non-gnu/cvs/binary/stable/x86-woe/), [MacOS](https://formulae.brew.sh/formula/cvs)) should be accessible in the PATH
* Visual Studio Code v1.51.0

## Extension Settings

`CodeCVS` extension contributes the following settings:

* `vscode-cvs.CVSROOT`: [CVSROOT](https://wiki.gentoo.org/wiki/CVS/Tutorial#The_CVSROOT) variable
