# [LDAP Explorer](https://marketplace.visualstudio.com/items?itemName=fengtan.ldap-explorer)

[![Build](https://github.com/fengtan/ldap-explorer/actions/workflows/build.yml/badge.svg)](https://github.com/fengtan/ldap-explorer/actions/workflows/build.yml)

[LDAP](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol) client for [VS Code](https://code.visualstudio.com/).

TODO put animation here \!\[feature X\]\(images/feature-x.png\)

## Features

### Browse LDAP tree

TODO "Directory Information Tree"

### List LDAP attributes

TODO

### Search for LDAP entries

TODO

### Manage bookmarks

TODO

### Support for multiple connections

TODO

## Installation

* Open VS Code
* Open the [extension view](https://code.visualstudio.com/docs/editor/extension-marketplace) by hitting `Ctrl+Shift+X` (or `Cmd+Shift+X`) and install [LDAP Explorer](https://marketplace.visualstudio.com/items?itemName=fengtan.ldap-explorer)
* Alternatively, hit `Ctrl+P` (or `Cmd+P`) and type `ext install fengtan.ldap-explorer`

## Commands

This extension contributes the following commands:

TODO explain all commands

### Connections

* **LDAP Explorer: Add new Connection**
* **LDAP Explorer: Edit Connection**
* **LDAP Explorer: Delete Connection**
* **LDAP Explorer: Set active Connection**
* **LDAP Explorer: Set no active Connection**

### LDAP entries

* **LDAP Explorer: Refresh**
* **LDAP Explorer: Show Attributes**
* **LDAP Explorer: Copy DN to clipboard**
* **LDAP Explorer: Add to Bookmarks**
* **LDAP Explorer: Remove from Bookmarks**

## Configuration

This extension contributes the following settings:

**ldap-explorer.show-tree-item-icons** (`false`)

Show/hide icons in the tree. TODO explain when icons are "ou", "cn", etc. TODO provide screenshots

**ldap-explorer.connections** (`[]`)

List of LDAP connections. TODO provide example

## Alternative tools

* [Apache Directory Studio](https://directory.apache.org/studio/) is a fully-featured LDAP client based on [Eclipse RCP](https://wiki.eclipse.org/Rich_Client_Platform)
- [JXplorer](http://jxplorer.org/) is a cross-platform LDAP browser and editor with many features
- [ldapsearch](https://linux.die.net/man/1/) is a command-line tool for *nix systems
* [dsquery](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/cc754232(v=ws.11)) is a command-line tool for Windows
- [LEX](http://www.ldapexplorer.com/) is a Windows-only desktop client that requires a paying license (free trial)
- [Many others](https://en.wikipedia.org/wiki/List_of_LDAP_software)

## Contributing

TODO

## Credits

This extension is powered by [ldapjs](http://ldapjs.org/).
