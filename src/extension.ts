import * as vscode from 'vscode';
import { LdapConnectionManager } from './ldapConnectionManager';
import { LdapDataProvider } from './ldapDataProvider';
import { LdapTreeItem } from './ldapTreeItem';
import * as webviews from './webviews';

// This method is called when the extension is activated (see activationEvents in package.json).
export function activate(context: vscode.ExtensionContext) {

	// Create tree view with our LDAP data provider.
	const ldapDataProvider = new LdapDataProvider();
	vscode.window.createTreeView('ldap-explorer-view', {treeDataProvider: ldapDataProvider});

	// Implement "Add connection" command (declared in package.json).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.add-connection', () => {
		webviews.createAddEditConnectionWebview(context);
	}));

	// Implement "Edit connection" command.
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.edit-connection', (treeItem?: LdapTreeItem) => {
		if (treeItem instanceof LdapTreeItem) {
			// The command fired from the contextual menu of the tree view: treeItem is defined.
			// We can extract the connection associated with the item.
			webviews.createAddEditConnectionWebview(context, treeItem?.getLdapConnection());
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
			vscode.window.showQuickPick(connectionOptions, { placeHolder: "Select a connection" }).then(option => {
				// If no connection was selected, then do nothing.
				if (option === undefined) {
					return;
				}
				// Otherwise edit the connection.
				webviews.createAddEditConnectionWebview(context, LdapConnectionManager.getConnection(option.id));
			});
		}
	}));

	// Implement "Delete connection" command.
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.delete-connection', (treeItem?: LdapTreeItem) => {
		if (treeItem instanceof LdapTreeItem) {
			// The command fired from the contextual menu of the tree view: treeItem is defined.
			// We can extract the connection associated with the item.
			LdapConnectionManager.removeConnection(treeItem.getLdapConnection());
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
			vscode.window.showQuickPick(connectionOptions, { placeHolder: "Select a connection" }).then(option => {
				// If no connection was selected, then do nothing.
				if (option === undefined) {
					return;
				}
				// Otherwise delete the connection.
				LdapConnectionManager.removeConnection(LdapConnectionManager.getConnection(option.id));
			});
		}
	}));

	// Implement "Refresh" command (refreshes the tree view).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.refresh-view', () => {
		ldapDataProvider.refresh();
	}));

	// Implement "Show attributes" command (show attributes of the DN in a webview).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.show-attributes', (treeItem?: LdapTreeItem) => {
		if (treeItem instanceof LdapTreeItem) {
			// The command fired from the contextual menu of the tree view: treeItem is defined.
			// We can extract the connection and the DN associated with the item.
			webviews.createAttributesWebview(treeItem.getLdapConnection(), treeItem.getDn(), context);
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
			vscode.window.showQuickPick(connectionOptions, { placeHolder: "Select a connection" }).then(option => {
				// If user cancelled the connection quick pick, then do nothing.
				if (option === undefined) {
					return;
				}
				// Otherwise ask the user for a DN.
				vscode.window.showInputBox({ placeHolder: "Enter a DN (e.g. cn=readers,ou=users,dc=example,dc=org)"}).then(dn => {
					// If no DN was provided, then do nothing.
					if (dn === undefined) {
						return;
					}
					// Otherwise show webview with attributes of the DN.
					webviews.createAttributesWebview(LdapConnectionManager.getConnection(option.id), dn, context);
				});
			});
		}
	}));

	// @todo is it necessary to pass all registered commands through context.subscriptions.push() ?
	
}

// This method is called when your extension is deactivated.
export function deactivate() {

	// @todo clear provider ? See todo-tree
	// @todo unbind all connections http://ldapjs.org/client.html#unbind

}
