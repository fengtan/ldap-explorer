documentation in README
- screenshot etc
- pointer to https://code.visualstudio.com/api
- how to test:
  1. Open project in vscode (using remote-containers extension)
  2. Hit F5 - should open a new instance of VS Code with the extension running
  0 prolly need to run `npm install` too (add `npm install` to devcontainer.json's postCreateAction as well)
- URL of project on github
- drop of reference vsc-extension-quickstart.md
- run this command in (devcontainer) terminal to list dummy users ; explain how to fill in the form (webview) to get similar results (e.g. set base DN to dc=example,dc=org)
```
ldapsearch -x -b "dc=example,dc=org" -H ldap://ldap:1389 -D "cn=admin,dc=example,dc=org" -w foobar -LLL
```
- make sure the code is well documented and consistent
- explain Base DN, see that documentation drupal provides
- list alternatives in README.md (container-based software I listed in jira, as well as Jxplorer)
- explain all commands accessible from the command palette
- explain connections end up in user settings by default, you can add those to workspace settings or devcontainer.json if you like
- anonymous bind: just leave binddn and bindpwd empty when creating a connection
- support for environment variables when value matches "${}" (hello, containers), also handy if you don't want to store unencrypted passwords in vscode settings ; a few environment variables are readily available in test (docker) environment: LDAP_*. If you change the env vars in docker-compose.yml then you will have to rebuild the container in order to see the changes in the UI
- explain that connection details are added to the settings" (along with JSON object and location of the settings file i.e. whether it was stored in global or workspace settings) - provide an example
- explain how to reveal the logs (logger output channel)
- explain pre-commit, also explain how to disable it (rm .git/precommitfoobar) ; explain how to run it on all files (not just those staged to be committed)
- explain how to run autotests
- mention that support paging i.e. all items show up even if more than 1,000 children (common limit enforce by many LDAP servers)
- explain, example of LDAP filter
- support for environment variables in all fields except connection name

metadata / deployment
- license (in package.json and in README.md)
- make sure the repo URL listed in package.json is correct
- CHANGELOG.txt

clean up
- egrep todo
- list anything that is not required for prod in .vscodeignore (e.g. devcontainer.json)
- list all registered commands in package.json's activationEvents
- define strings in package.nl.json so they are translatable and common
- git log | grep mas
- make sure there is no unnecesary import ; run some code optimization tool / quality checks

CI
- github action should run eslint + autotests
- autotests
  - test calling all commands from palette

test
- test "test connection" in various conditions (invalid host, server down, wrong credentials, wrong base DN etc) -> does not seem to complain if base DN is "test"

bugs
- webview persistence
  - persist "show attributes" webview (if go to background then no contents)
  - persist webview that shows search results
  - persist add/edit connection
- settings
  - add a setting to let end user decide whether search results and attributes should open in a new window or if the same window should always be reused
- console
  - bunch of errors in chrome dev tools when click on tree items
  - bunch of errors in console also when searching

WC
- content security policy / sanitization https://code.visualstudio.com/api/extension-guides/webview#content-security-policy -> https://code.visualstudio.com/api/extension-guides/command#command-uris ; see example in webview-view-sample
- ldapsj accepts a "log" attribute in constructor http://ldapjs.org/client.html#create-a-client ; use it to replace LdapLogger
- support to add/delete/edit/rename/remove new entry (and add checkbox "readonly connection" when creating/editing a connection)

# ldap-explorer README

This is the README for your extension "ldap-explorer". After writing up a brief description, we recommend including the following sections.

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
