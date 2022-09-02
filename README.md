TODO
- pre-commit
  - (install automatically in devcontainer's postCreateAction) - run eslint automatically
  - linter (for typescript + for package.json)
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
  - option to ask for password on connect (same as sqltools) for security purposes
  - run this command in (devcontainer) terminal to list dummy users ; explain how to fill in the form (webview) to get similar results (e.g. set base DN to dc=example,dc=org)
  ```
  ldapsearch -x -b "dc=example,dc=org" -H ldap://ldap:1389 -D "cn=admin,dc=example,dc=org" -w foobar -LLL
  ```
  - make sure the code is well documented and consistent
  - explain Base DN, see that documentation drupal provides
  - list alternatives in README.md (container-based software I listed in jira, as well as Jxplorer)
- metadata
  - license (in package.json and in README.md)
  - make sure the repo URL listed in package.json is correct
  - branch master -> main
  - rename ldap-browser -> ldap-explorer
- autotests
- clean up
  - egrep todo
  - list anything that is not required for prod in .vscodeignore (e.g. devcontainer.json)
  - list all registered commands in package.json's activationEvents
  - `import * as vscode from 'vscode';` -> we prolly do not need to import everything
- best practices
  - define strings in package.nl.json so they are translatable and common
features
  - command "Connect to..." (quick pick server)
  - command *palette* "Delete connection..." (currently disabled in command palette)
  - command "ldap-browser.show-attributes" should show in command palette (open a quick pick so the user can paste the DN) ; document this feature in README.md
  - button "test connection" / verifies credentials
  - ability to *edit* a connection's settings (not just add and delete)
  - creating a new connection should open focus on our view
  - button should be styled as blue vscode button: try <vscode-button>Save</vscode-button>
  - webview values are disposed when go to background
  - setting to limit number of results to display (1,000 in jxplorer)
  - show details of connection in tree view (same as sqltools: username@localhost:3306/foo)
  - dump ldapsearch commands in console as ldap queries are sent ? See ldapjs's "log" option http://ldapjs.org/client.html
  - implement pager for folders that include > 1,000 items
  - support for add/update/delete operations i.e. not a readonly connection ?
  - most settings should be set globally and not be connection-specific (e.g. timeout) http://ldapjs.org/client.html
  - additional options when creating connection: log, timeout, connectTimeout (http://ldapjs.org/client.html#create-a-client)
  - bookmarks feature (with favorite OU's) ?
  - option to sort results ? https://stackoverflow.com/questions/63678234/creating-the-client-control-object-for-ldapjs-server-side-sorting
  - somehow an option to search e.g. which groups a user belongs to
  - UX: when clicking the "plus" icon, this opens multiple webviews to add connections ; ideally you would have only one window for adding connection. See what options are possible when creating the webview (constructor)
  - UX: should multiple webviews "show-details" be allowed ? Autoclose by default, similar to VSCode editor ?
  - add command "show-details" to command palette so you can check the contents of an AD group via Quick Pick that would be really awesome
  - when creating a connection, have the option to read the bind password from a file or from an environment variable (so you can add the settings from devcontainer.json without putting the password in git)
  - implement security recommendations https://code.visualstudio.com/api/extension-guides/webview#security
  - drop field "connection name", we don't use display it anywhere. Make sure we still have a mechanism to ensure unique connections (and ensure connections are deleted properly from settings)

WC
- add support for filters (with built-in UI in vscode) ? http://ldapjs.org/filters.html
- UX: show connections as a drop-down similar to remote-explorer or debugging interface


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
