import { commands, ExtensionContext, window } from 'vscode';
import { LdapConnection } from './ldapConnection';
import { LdapConnectionManager } from './ldapConnectionManager';
import { LdapDataProvider } from './ldapDataProvider';
import { LdapTreeItem } from './ldapTreeItem';
import { createAddEditConnectionWebview, createAttributesWebview } from './webviews';

// This method is called when the extension is activated (see activationEvents in package.json).
export function activate(context: ExtensionContext) {

	// Create tree view with our LDAP data provider.
	const ldapDataProvider = new LdapDataProvider();
	context.subscriptions.push(window.createTreeView('ldap-explorer-tree', {treeDataProvider: ldapDataProvider}));

	// Implement "Add connection" command (declared in package.json).
	context.subscriptions.push(commands.registerCommand('ldap-explorer.add-connection', () => {
		createAddEditConnectionWebview(context);
	}));

	// Implement "Edit connection" command.
	context.subscriptions.push(commands.registerCommand('ldap-explorer.edit-connection', (treeItem?: LdapTreeItem) => {
		if (treeItem instanceof LdapTreeItem) {
			// The command fired from the contextual menu of the tree view: treeItem is defined.
			// We can extract the connection associated with the item.
			createAddEditConnectionWebview(context, treeItem?.getLdapConnection());
		} else {
			// The command fired from the command palette: treeItem is undefined.
			// We explicitly ask the user to pick a connection.
			const connectionOptions = LdapConnectionManager.getConnections().map(connection => {
				return {
					label: connection.getBaseDn(true),
					description: connection.getUrl(),
					id: connection.getId(),
				};
			});
			window.showQuickPick(connectionOptions, { placeHolder: "Select a connection" }).then(option => {
				// If no connection was selected, then do nothing.
				if (option === undefined) {
					return;
				}
				// Otherwise edit the connection.
				LdapConnectionManager.getConnection(option.id).then(
					connection => {
						createAddEditConnectionWebview(context, connection);
					},
					reason => {
						window.showErrorMessage(`Unable to edit connection "${option.id}": ${reason}`);
					}
				);
			});
		}
	}));

	// Implement "Delete connection" command.
	context.subscriptions.push(commands.registerCommand('ldap-explorer.delete-connection', (treeItem?: LdapTreeItem) => {
		// Utility function to ask for a confirmation and actually remove the connection from settings.
		const askAndRemoveConnection = (connection: LdapConnection) => {
			window.showInformationMessage(`Are you sure you want to remove the connection ${connection.getBaseDn(true)} (${connection.getUrl()}) ?`, { modal: true}, "Yes").then(confirm => {
				if (confirm) {
					LdapConnectionManager.removeConnection(connection).then(
						value => {
							// If connection was successfully removed, refresh tree view so it does not show up anymore.
							commands.executeCommand("ldap-explorer.refresh-tree");
						},
						reason => {
							// If connection could not be removed, show error message.
							window.showErrorMessage(`Unable to remove connection: ${reason}`);
						}
					);
				}
			});
		};

		if (treeItem instanceof LdapTreeItem) {
			// The command fired from the contextual menu of the tree view: treeItem is defined.
			// We can extract the connection associated with the item.
			askAndRemoveConnection(treeItem.getLdapConnection());
		} else {
			// The command fired from the command palette: treeItem is undefined.
			// We explicitly ask the user to pick a connection.
			const connectionOptions = LdapConnectionManager.getConnections().map(connection => {
				return {
					label: connection.getBaseDn(true),
					description: connection.getUrl(),
					id: connection.getId(),
				};
			});
			window.showQuickPick(connectionOptions, { placeHolder: "Select a connection" }).then(option => {
				// If no connection was selected, then do nothing.
				if (option === undefined) {
					return;
				}
				// Delete the connection.
				LdapConnectionManager.getConnection(option.id).then(
					connection => {
						askAndRemoveConnection(connection);
					},
					reason => {
						window.showErrorMessage(`Unable to delete connection "${option.id}": ${reason}`);
					}
				);
			});
		}
	}));

	// Implement "Refresh" command (refreshes the tree view).
	context.subscriptions.push(commands.registerCommand('ldap-explorer.refresh-tree', () => {
		ldapDataProvider.refresh();
	}));

	// Implement "Show attributes" command (show attributes of the DN in a webview).
	context.subscriptions.push(commands.registerCommand('ldap-explorer.show-attributes', (treeItem?: LdapTreeItem) => {
		if (treeItem instanceof LdapTreeItem) {
			// The command fired from the contextual menu of the tree view: treeItem is defined.
			// We can extract the connection and the DN associated with the item.
			createAttributesWebview(treeItem.getLdapConnection(), treeItem.getDn(), context);
		} else {
			// The command fired from the command palette: treeItem is undefined.
			// Explicitly ask the user for a connection.
			const connectionOptions = LdapConnectionManager.getConnections().map(connection => {
				return {
					label: connection.getBaseDn(true),
					description: connection.getUrl(),
					id: connection.getId(),
				};
			});
			window.showQuickPick(connectionOptions, { placeHolder: "Select a connection" }).then(option => {
				// If user cancelled the connection quick pick, then do nothing.
				if (option === undefined) {
					return;
				}
				LdapConnectionManager.getConnection(option.id).then(
					connection => {
						// Ask the user for a DN.
						window.showInputBox({ placeHolder: "Enter a DN (e.g. cn=readers,ou=users,dc=example,dc=org)"}).then(dn => {
							// If no DN was provided, then do nothing.
							if (dn === undefined) {
								return;
							}
							// Otherwise show webview with attributes of the DN.
							createAttributesWebview(connection, dn, context);
						});
					},
					reason => {
						window.showErrorMessage(`Unable to show attributes for connection "${option.id}": ${reason}`);
					}
				);
			});
		}
	}));
	
}

// This method is called when your extension is deactivated.
export function deactivate() {}
