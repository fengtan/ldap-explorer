# [LDAP Explorer](https://marketplace.visualstudio.com/items?itemName=fengtan.ldap-explorer)

[![Build](https://github.com/fengtan/ldap-explorer/actions/workflows/build.yml/badge.svg)](https://github.com/fengtan/ldap-explorer/actions/workflows/build.yml)

[LDAP](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol) client for [VS Code](https://code.visualstudio.com/).

TODO put animation here

## Features

### Browse the directory information tree

![Browse the directory information tree](.screenshots/features.tree.png)

### List attributes

![List attributes](.screenshots/features.attributes.png)

### Search and filter

![Search and filter](.screenshots/features.search.png)

### Manage bookmarks

![Manage bookmarks](.screenshots/features.bookmarks.png)

### Support for multiple connections

![Support for multiple connections](.screenshots/features.connections.png)

## Installation

* Open VS Code
* Open the [extension view](https://code.visualstudio.com/docs/editor/extension-marketplace) by hitting `Ctrl+Shift+X` (or `Cmd+Shift+X`) and install [LDAP Explorer](https://marketplace.visualstudio.com/items?itemName=fengtan.ldap-explorer)
* Alternatively, hit `Ctrl+P` (or `Cmd+P`) and type `ext install fengtan.ldap-explorer`

## Commands

This extension contributes the following commands.

### Connections

* **LDAP Explorer: Add new Connection**
* **LDAP Explorer: Edit Connection**
* **LDAP Explorer: Delete Connection**
* **LDAP Explorer: Set active Connection** - an active connection is required for the Tree, Bookmarks and Search views to be functional
* **LDAP Explorer: Set no active Connection** - clears currently active connection, if any

### LDAP entries

* **LDAP Explorer: Refresh** - refreshes the Connections, Tree and Bookmarks views
* **LDAP Explorer: Show Attributes** - lists attributes of a given LDAP entry
* **LDAP Explorer: Copy DN to clipboard**
* **LDAP Explorer: Add to Bookmarks** - the LDAP entry will be added to the Bookmarks view
* **LDAP Explorer: Remove from Bookmarks** - the LDAP entry will be removed from the Bookmarks view

## Configuration

This extension contributes the following settings:

* **ldap-explorer.show-tree-item-icons** (`false`)

If set to `true`, LDAP entries will be rendered with an icon in the Tree view based on their entity type:
- `dc`, `c`, `o` or `ou`: TODO
- `cn`: TODO
- otherwise: TODO

TODO provide the two screenshots in assets/configuration.XX

* **ldap-explorer.connections** (`[]`)

List of LDAP connections. Example:

```json
{
  "ldap-explorer.connections": [
    {
      "name": "ACME prod",
      "protocol": "ldap",
      "host": "acme.example.net",
      "port": "389",
      "binddn": "cn=admin,dc=example,dc=org",
      "bindpwd": "foobar",
      "basedn": "dc=example,dc=org",
      "limit": "0",
      "timeout": "5000",
      "bookmarks": [
        "cn=readers,ou=users,dc=example,dc=org"
      ]
    }
  ]
}
```

## Alternative tools

* [Apache Directory Studio](https://directory.apache.org/studio/) is a fully-featured LDAP client based on [Eclipse RCP](https://wiki.eclipse.org/Rich_Client_Platform)
- [JXplorer](http://jxplorer.org/) is a cross-platform LDAP browser and editor with many features
- [ldapsearch](https://linux.die.net/man/1/) is a command-line tool for *nix systems
* [dsquery](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/cc754232(v=ws.11)) is a command-line tool for Windows
- [LEX](http://www.ldapexplorer.com/) is a Windows-only desktop client that requires a paying license (a free trial is offered)
- [Many others](https://en.wikipedia.org/wiki/List_of_LDAP_software)

## Contributing

TODO

## Credits

This extension is powered by [ldapjs](http://ldapjs.org/).

Main icon by [Freepik](https://www.freepik.com/) from [Flaticon](https://www.flaticon.com/) is licensed by [CC 3.0 BY](https://creativecommons.org/licenses/by/3.0/). TODO verify Freepik
