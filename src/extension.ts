import { commands, ExtensionContext, window } from 'vscode';
import { LdapConnection } from './LdapConnection';
import { LdapConnectionManager } from './LdapConnectionManager';
import { LdapConnectionsDataProvider } from './tree-providers/LdapConnectionsDataProvider';
import { LdapTreeDataProvider } from './tree-providers/LdapTreeDataProvider';
import { LocalState } from './LocalState';
import { createAddEditConnectionWebview } from './webviews/addEditConnectionWebview';
import { createShowAttributesWebview } from './webviews/showAttributesView';

// This method is called when the extension is activated (see activationEvents in package.json).
export function activate(context: ExtensionContext) {

  // Create local storage object so the active connection can be persisted in the state.
  const localState = new LocalState(context);

  // Create views (connections, tree, search).
  const ldapConnectionsDataProvider = new LdapConnectionsDataProvider(localState);
  context.subscriptions.push(window.createTreeView('ldap-explorer-view-connections', { treeDataProvider: ldapConnectionsDataProvider }));

  const ldapTreeDataProvider = new LdapTreeDataProvider(localState);
  context.subscriptions.push(window.createTreeView('ldap-explorer-view-tree', { treeDataProvider: ldapTreeDataProvider }));

  // @todo implement search view

  // Implement "Add connection" command (declared in package.json).
  context.subscriptions.push(commands.registerCommand('ldap-explorer.add-connection', () => {
    createAddEditConnectionWebview(context);
  }));

  // Implement "Edit connection" command.
  context.subscriptions.push(commands.registerCommand('ldap-explorer.edit-connection', (connection?: LdapConnection) => {
    // @todo the test should be !connection, not instanceof (similar comment for *all* commands)
    if (connection instanceof LdapConnection) {
      // The command fired from the contextual menu of the tree view: treeItem is defined.
      // We can extract the connection associated with the item.
      createAddEditConnectionWebview(context, connection);
    } else {
      // The command fired from the command palette: treeItem is undefined.
      // We explicitly ask the user to pick a connection.
      const connectionOptions = LdapConnectionManager.getConnections().map(con => {
        return {
          label: con.getBaseDn(true),
          description: con.getUrl(),
          name: con.getName(),
        };
      });
      window.showQuickPick(connectionOptions, { placeHolder: "Select a connection" }).then(option => {
        // If no connection was selected, then do nothing.
        if (option === undefined) {
          return;
        }
        // Otherwise edit the connection.
        const connection = LdapConnectionManager.getConnection(option.name);
        if (connection === undefined) {
          window.showErrorMessage(`Unable to edit connection '${option.name}': connection is unknown`);
          return;
        }
        createAddEditConnectionWebview(context, connection);
      });
    }
  }));

  // Implement "Delete connection" command.
  context.subscriptions.push(commands.registerCommand('ldap-explorer.delete-connection', (connection?: LdapConnection) => {
    // Utility function to ask for a confirmation and actually remove the connection from settings.
    const askAndRemoveConnection = (con: LdapConnection) => {
      window.showInformationMessage(`Are you sure you want to remove the connection '${con.getName()} ?`, { modal: true }, "Yes").then(confirm => {
        if (confirm) {
          LdapConnectionManager.removeConnection(con).then(
            value => {
              // If connection was successfully removed, refresh tree view so it does not show up anymore.
              commands.executeCommand("ldap-explorer.refresh");
            },
            reason => {
              // If connection could not be removed, show error message.
              window.showErrorMessage(`Unable to remove connection: ${reason}`);
            }
          );
        }
      });
    };

    if (connection instanceof LdapConnection) {
      // The command fired from the contextual menu of the tree view: treeItem is defined.
      // We can extract the connection associated with the item.
      askAndRemoveConnection(connection);
    } else {
      // The command fired from the command palette: treeItem is undefined.
      // We explicitly ask the user to pick a connection.
      const connectionOptions = LdapConnectionManager.getConnections().map(con => {
        return {
          label: con.getBaseDn(true),
          description: con.getUrl(),
          name: con.getName(),
        };
      });
      window.showQuickPick(connectionOptions, { placeHolder: "Select a connection" }).then(option => {
        // If no connection was selected, then do nothing.
        if (option === undefined) {
          return;
        }
        // Delete the connection.
        const connection = LdapConnectionManager.getConnection(option.name);
        if (connection === undefined) {
          window.showErrorMessage(`Unable to delete connection '${option.name}': connection is unknown`);
          return;
        }
        askAndRemoveConnection(connection);
      });
    }
  }));

  // Implement "Activate connection" command.
  // @todo async/await, or thenable ?
  context.subscriptions.push(commands.registerCommand('ldap-explorer.activate-connection', (connection: LdapConnection) => {
    // Store name of new active connection in Memento.
    localState.setActiveConnection(connection.getName());

    // Refresh views so the new active connection shows up.
    commands.executeCommand("ldap-explorer.refresh");
  }));

  // Implement "Refresh" command (refreshes both the connections view and the tree view).
  context.subscriptions.push(commands.registerCommand('ldap-explorer.refresh', () => {
    ldapConnectionsDataProvider.refresh();
    ldapTreeDataProvider.refresh();
  }));

  // Implement "Show attributes" command (show attributes of the DN in a webview).
  context.subscriptions.push(commands.registerCommand('ldap-explorer.show-attributes', (dn?: string) => {
    /* TODO all of this is messed up
    if (!dn) {
      // The command fired from the contextual menu of the tree view: treeItem is defined.
      // We can extract the connection and the DN associated with the item.
      const connectionName = localState.getActiveConnection();
      if (connectionName === undefined) {
        // @todo drop this test, or at least show an error.
        return;
      }
      LdapConnectionManager.getConnection(connectionName).then(
        (connection: LdapConnection) => {
          createShowAttributesWebview(connection, dn, context);
        },
        reason => {
          // @todo handle errors.
        }
      );
    } else {
      // The command fired from the command palette: treeItem is undefined.
      // Explicitly ask the user for a connection.
      const connectionOptions = LdapConnectionManager.getConnections().map(connection => {
        return {
          label: connection.getBaseDn(true),
          description: connection.getUrl(),
          name: connection.getName(),
        };
      });
      window.showQuickPick(connectionOptions, { placeHolder: "Select a connection" }).then(option => {
        // If user cancelled the connection quick pick, then do nothing.
        if (option === undefined) {
          return;
        }
        LdapConnectionManager.getConnection(option.name).then(
          connection => {
            // Ask the user for a DN.
            window.showInputBox({ placeHolder: "Enter a DN (e.g. cn=readers,ou=users,dc=example,dc=org)" }).then(dn => {
              // If no DN was provided, then do nothing.
              if (dn === undefined) {
                return;
              }
              // Otherwise show webview with attributes of the DN.
              createShowAttributesWebview(connection, dn, context);
            });
          },
          reason => {
            window.showErrorMessage(`Unable to show attributes for connection '${option.name}': ${reason}`);
          }
        );
      });
    }
    */
  }));

}

// This method is called when your extension is deactivated.
export function deactivate() { }
