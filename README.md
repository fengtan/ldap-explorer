TODO
- pre-commit
  - (install automatically in devcontainer's postCreateAction) - run eslint automatically
  - linter
  - npm validate (is this a thing ?) similar to composer validate
- documentation in README
  - screenshot etc
  - pointer to https://code.visualstudio.com/api
  - how to test:
    1. Open project in vscode (using remote-containers extension)
    2. Hit F5 - should open a new instance of VS Code with the extension running
    0 prolly need to run `npm install` too (add `npm install` to devcontainer.json's postCreateAction as well)
  - URL of project on github
  - drop of reference vsc-extension-quickstart.md
- metadata
  - license (in package.json and in README.md)
  - make sure the repo URL listed in package.json is correct
  - add 'categories' to package.json
  - branch master -> main
  - move repo from vscode-ldap to ldap-browser
- autotests
- clean up
  - drop anything "helloworld" -i || "hello world" -i
  - egrep todo
- best practices
  - define strings in package.nl.json so they are translatable and common
features
  - command "Connect to..." (quick pick server)
  - command "Delete connection..." (?)
  - command icon (top-right corner of the view)


# ldap-browser README

This is the README for your extension "ldap-browser". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
