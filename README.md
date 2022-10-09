# [LDAP Explorer](https://marketplace.visualstudio.com/items?itemName=fengtan.ldap-explorer)

[![Build](https://github.com/fengtan/ldap-explorer/actions/workflows/build.yml/badge.svg)](https://github.com/fengtan/ldap-explorer/actions/workflows/build.yml)

[LDAP](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol) client for [VS Code](https://code.visualstudio.com/).

![Overview](screenshots/overview.png)

## Features

* **Browse the tree** - Explore how the [DIT](https://en.wikipedia.org/wiki/Directory_information_tree) is structured and discover LDAP entries in an intuitive interface
* **List attributes** - Find out about LDAP attributes without writing search filters
* **Search and filter** - Conveniently search for LDAP entries directly from VS Code
* **Manage bookmarks** - Bookmark LDAP entries you often need to check or located in awkward places
* **Support for multiple connections** - Manage multiple LDAP connections, such as a test and a production connections
* **Support for environment variables** - Easy integration with containers and increased security: you don't have to store your bind credentials unencrypted in VS Code settings

## Demo

See [this animation](screenshots/anim.gif) for a demo.

## Installation

* Open VS Code
* Open the [extension view](https://code.visualstudio.com/docs/editor/extension-marketplace) by hitting `Ctrl+Shift+X` (or `Cmd+Shift+X`) and install [LDAP Explorer](https://marketplace.visualstudio.com/items?itemName=fengtan.ldap-explorer)
* Alternatively, hit `Ctrl+P` (or `Cmd+P`) and type `ext install fengtan.ldap-explorer`

## Usage

1. Open the **LDAP Explorer** view from the [activity bar](https://code.visualstudio.com/docs/getstarted/userinterface)
2. Under panel **Connections**, click the button **Add new connection**
3. Fill in the connection settings
  * As stated most of the settings support environment variables
  * Leave **Bind DN** and **Bind Password** empty to bind as anonymous
  * **Maximum number of entries to return** allows to limit the size of LDAP responses, although most LDAP servers will return at most 1,000 entries regardless of this setting. If an LDAP query returns more than this limit then you will be shown an error (in which case you may try to increase the limit).
4. Under panel **Connections**, click on the connection to activate it
5. Now you may browse the tree, manage bookmarks and run search queries from the **Tree**, **Bookmarks** and **Search** panels, respectively

## Commands

This extension contributes the following commands:

* **LDAP Explorer: Add new Connection**
* **LDAP Explorer: Edit Connection**
* **LDAP Explorer: Delete Connection**
* **LDAP Explorer: Set active Connection** - An active connection is required for the Tree, Bookmarks and Search views to be functional
* **LDAP Explorer: Set no active Connection** - Clears currently active connection, if any
* **LDAP Explorer: Refresh** - Refreshes the Connections, Tree and Bookmarks views
* **LDAP Explorer: Show Attributes** - Lists attributes of a given LDAP entry
* **LDAP Explorer: Copy DN to clipboard**
* **LDAP Explorer: Add to Bookmarks** - The LDAP entry will be added to the Bookmarks view
* **LDAP Explorer: Remove from Bookmarks** - The LDAP entry will be removed from the Bookmarks view

## Configuration

This extension contributes the following settings:

* **ldap-explorer.show-tree-item-icons** (`false`)

If set to `true`, LDAP entries in the Tree view will be rendered with an icon based on their entity type:
- `dc`, `c`, `o` or `ou`: ![organization icon](https://raw.githubusercontent.com/microsoft/vscode-codicons/main/src/icons/organization.svg)
- `cn`: ![person icon](https://raw.githubusercontent.com/microsoft/vscode-codicons/main/src/icons/person.svg)
- otherwise: ![primitive square icon](https://raw.githubusercontent.com/microsoft/vscode-codicons/main/src/icons/primitive-square.svg)

| `ldap-explorer.show-tree-item-icons: false` | `ldap-explorer.show-tree-item-icons: true` |
|---------------------------------------------|--------------------------------------------|
|![tree without icons](screenshots/configuration.icons.false.png) | ![tree with icons](screenshots/configuration.icons.true.png) |

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

See [CONTRIBUTING.md](https://github.com/fengtan/ldap-explorer/blob/master/CONTRIBUTING.md).

## Changelog

See [CHANGELOG.md](https://github.com/fengtan/ldap-explorer/blob/master/CHANGELOG.md).

## Credits

This extension is powered by [ldapjs](http://ldapjs.org/).

Main icon by [Freepik](https://www.freepik.com/) from [Flaticon](https://www.flaticon.com/) is licensed by [CC 3.0 BY](https://creativecommons.org/licenses/by/3.0/).
