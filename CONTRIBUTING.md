# Prerequisites

[Install VS Code](https://code.visualstudio.com/docs/setup/setup-overview).

Installing the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension will provide you with a ready-to-use development environment.

# Building the development environment

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

# Testing the dummy LDAP server

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

| Protocol      | `ldap` |
| Host          | `ldap` (or `${LDAP_HOST}`) |
| Port          | `1389` (or `${LDAP_PORT}`) |
| Bind DN       | `cn=admin,dc=example,dc=org` (or `${LDAP_BIND_DN}`) |
| Bind Password | `foobar` (or `${LDAP_BIND_PWD}`) |
| Base DN       | `dc=example,dc=org` (or `${LDAP_BASE_DN}` |

Set [breakpoints](https://code.visualstudio.com/docs/editor/debugging#_breakpoints) if necessary.

Hit `Ctrl+R` to refresh the test VS Code instance after you have made modifications to the code.

Hit `Shift+F5` to stop the test VS Code instance.

# Linting

Run the linter:

```sh
npm run lint
```

A [pre-commit](https://pre-commit.com/) file is included in this repo and will run the linter on every git commit.

# Automated tests

Run automated tests:

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
1. Electron Console: hit `Ctrl+Shift+I` (or `Cmd+Shift+I`) or Help > Toggle Developer Tools
2. Application logs: TODO
