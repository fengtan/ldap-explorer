# Building the development environment

## Prerequisites

[Install VS Code](https://code.visualstudio.com/docs/setup/setup-overview).

Install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension.

## Build environment

Open the project in VS Code:

```sh
git clone https://github.com/fengtan/ldap-explorer.git
code ldap-explorer
```

Open the command palette by hitting `Ctrl+Shift+P` (or `Cmd+Shift+P`) and select `Dev Containers: Rebuild and Reopen in Container` (see [documentation](https://code.visualstudio.com/docs/remote/containers) about Dev Containers).

You now have a set of two containers (see `.devcontainer/docker-compose.yml`):
- `node` is your dev container (VS Code runs inside)
- `ldap` is a dummy LDAP server you can connect to to test the extension

`npm install` will automatically run when you build the dev container for the first time.

Verify dependencies got installed by opening a terminal (hit `Ctrl+Shift~` or `Cmd+Shift+~`) and running:

```sh
npm install
```

## Dummy LDAP server

Verify you can access the dummy LDAP server from the dev container:

```sh
ldapsearch -x -b "dc=example,dc=org" -H ldap://ldap:1389 -D "cn=admin,dc=example,dc=org" -w foobar -LLL
```

Alternatively, with the environment variables already set:

```sh
ldapsearch -x -b "${LDAP_BASE_DN}" -H "${LDAP_PROTOCOL}://${LDAP_HOST}:${LDAP_PORT}" -D "${LDAP_BIND_DN}" -w "${LDAP_BIND_PWD}" -LLL
```

# Testing the extension

Open the [Run and Debug](https://code.visualstudio.com/docs/editor/debugging) view by hitting `Ctrl+Shift+D`, select `Run extension` and hit `F5`.

This will compile the source code and install the extension in a new VS Code instance where you can test it.

You may create a connection to the dummy LDAP server with these parameters (see `.devcontainer/docker-compose.yml`):

| Parameter     | Value (explicit)             | Value (environment variable) |
|---------------|------------------------------|------------------------------|
| Protocol      | `ldap`                       | `${LDAP_PROTOCOL}`           |
| Host          | `ldap`                       | `${LDAP_HOST}`               |
| Port          | `1389`                       | `${LDAP_PORT}`               |
| Bind DN       | `cn=admin,dc=example,dc=org` | `${LDAP_BIND_DN}`            |
| Bind Password | `foobar`                     | `${LDAP_BIND_PWD}`           |
| Base DN       | `dc=example,dc=org`          | `${LDAP_BASE_DN}`            |

Set [breakpoints](https://code.visualstudio.com/docs/editor/debugging#_breakpoints) if necessary.

Hit `Ctrl+R` to refresh the test VS Code instance after you have made modifications to the code.

Hit `Shift+F5` to stop the test VS Code instance.

# Quality

## Linting

Run the linter:

```sh
npm run lint
```

A [pre-commit](https://pre-commit.com/) file is included in this repo and will run the linter on all files affected by a git commit.

To run pre-commit on all files:

```sh
pre-commit run --all-files
```

Pre-commit gets automatically installed when building the dev container. To uninstall it:

```sh
rm -f .git/hooks/pre-commit
```

## Automated tests

Run automated tests (you may see failures about connecting to the bus - these can be ignored, see https://github.com/microsoft/vscode-test/issues/127):

```sh
xvfb-run -a npm run test
```

Alternatively, if you wish to see the test VS Code instance open in an actual X server, then you may run the command above on the host machine without [Xvfb](https://www.x.org/releases/X11R7.6/doc/man/man1/Xvfb.1.xhtml). The downside is that you need to install a node environment on your host machine:

```sh
npm run test
```

Alternatively, open the [Run and Debug](https://code.visualstudio.com/docs/editor/debugging) view by hitting `Ctrl+Shift+D`, select `Extension Tests` and hit `F5`. This will run the tests suite.

The automated tests also run in Github Actions (see `.github/workflows`). Check the results at https://github.com/fengtan/ldap-explorer/actions

# Troubleshooting

Errors typically show in a couple of places:
1. Electron Console: hit `Ctrl+Shift+I` (or `Cmd+Shift+I`) or menu Help > Toggle Developer Tools
2. Application logs: menu View > Output > LDAP Explorer

# To do

Features that might be worth implementing:
- Support for StartTLS http://ldapjs.org/client.html#starttls
- Support for write operations i.e. add, delete, edit, move LDAP entries
- Localization https://github.com/microsoft/vscode-nls
- Ability to reorder / sort bookmarks

# Resources

- [Codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html)
- [Extension API](https://code.visualstudio.com/api)
- [LDAPJS documentation](http://ldapjs.org/)
- [Type definitions for VS Code](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/vscode)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples/)
- [Webview UI Toolkit components](https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/docs/components.md)