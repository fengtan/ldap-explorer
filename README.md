documentation in README
- screenshot etc
- pointer to https://code.visualstudio.com/api, UI toolkit, ldapjs, etc
- see template sophie
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
- list alternatives in README.md (container-based software I listed in jira, as well as Jxplorer) ; also http://www.ldapexplorer.com/ which requires a license ; also https://en.wikipedia.org/wiki/List_of_LDAP_software ; also `ldapsearch`
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
- what's included: "Show DIT / Directory Information Tree"
- no support for SASL / GSS-API as the underlying library does not support it see https://github.com/ldapjs/node-ldapjs/issues/85
- list of acronyms (DIT / OU / DN / etc)
- size limit: if a search / tree level returns more than this limit then you will be shown with an error (in which case you may want to increase this limit)
- explain setting to show icons for tree items
- `xvfb-run -a npm run test` (you may see errors about dbus which can be ignored, see https://github.com/iperdomo/cypress-docker-test#fixing-the-errors) ; if you want to see the test vscode instance in a graphical interface you need a X display, best to run `npm run test` from the host (you'll have to install npm on the host)
- Known limitations / never
  - no support for referrals and aliases
  - if tree item has no child then drop expandable status
  - support startTLS http://ldapjs.org/client.html#starttls
  - support to add/delete/edit/rename/remove new entry (and add checkbox "readonly connection" when creating/editing a connection)
  - define strings in package.nls.json so they are translatable and common
  - option to reorder bookmarks
  - unsafe-inline CSP in all webviews
  - getState/setState is the preferred way to persist a webview's state (instead of retainContextWhenHidden which is more resource intensive and is used in all views) https://code.visualstudio.com/api/extension-guides/webview#getstate-and-setstate
- how to package / deploy extension with vsce
  - update CHANGELOG.txt
- explain bookmarks, provide screenshot
- `Ctrl+Shift+P` and  type "LDAP explorer" to run commands from the palette
- to run tests, you can also open the test view (`Ctrl+Shift+D`) andrun test "Extension Tests" ; to test extension pick "Run Extension"
- mention CHANGELOG.md and CONTRIBUTING.md
- deployment process should include reviewing README.md and CTRONITBUTING.md and CHANGELOG.md and package.json metadata
- CONTRIB.md resources:
  - codicons
  - webview ui toolkit
  - vscode-samples repo
  - api documentation
  - ldapjs documentation
  - explain automated publisihing in github https://code.visualstudio.com/api/working-with-extensions/continuous-integration#github-actions-automated-publishing
- explain github workflow runs lint & test & publish

metadata / deployment
- make sure the repo URL listed in package.json is correct
- CHANGELOG.txt (is it actually necessary ? https://marketplace.visualstudio.com/items/GitHub.copilot/changelog)
- list anything that is not required for prod in .vscodeignore (e.g. devcontainer.json)
- make github repo public
- bundle extension https://code.visualstudio.com/api/working-with-extensions/bundling-extension
- publish extension https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- package.json
  - galleryBanner https://marketplace.visualstudio.com/items?itemName=seanmcbreen.MDTools
  - badges
  - icon (flaticon ?) - also add to github project
  - extensionKind (test in remote containers)
- announce ldapjs mailing list
- drop vsc-extension-quickstart.md
- add link to vscode marketplace to README.md ; provide link that explains how to install a vscode extension
- github automated publishing https://code.visualstudio.com/api/working-with-extensions/continuous-integration#github-actions-automated-publishing

[![Build](https://github.com/fengtan/ldap-explorer/actions/workflows/build.yml/badge.svg)](https://github.com/fengtan/ldap-explorer/actions/workflows/build.yml)

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
