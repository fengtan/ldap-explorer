import * as vscode from 'vscode';
import { LdapConnectionManager } from './ldapConnectionManager';
import { LdapDataProvider } from './ldapDataProvider';
import { LdapTreeItem } from './ldapTreeItem';
import { createAttributesWebview} from './webviews/createAttributesWebview';
import { createAddConnectionWebview } from './webviews/createAddConnectionWebview';

// This method is called when the extension is activated (see activationEvents in package.json).
export function activate(context: vscode.ExtensionContext) {

	// Create tree view with our LDAP data provider.
	const ldapDataProvider = new LdapDataProvider();
	vscode.window.createTreeView('ldap-explorer-view', {treeDataProvider: ldapDataProvider});

	// Implement "Add connection" command (declared in package.json).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.add-connection', () => {
		createAddConnectionWebview(context);
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
			const connectionNames = LdapConnectionManager.getConnections().map(connection => connection.name);
			vscode.window.showQuickPick(connectionNames, { placeHolder: "Select a connection to delete." }).then(name => {
				// If no connection was selected, then do nothing.
				if (name === undefined) {
					return;
				}
				// Otherwise delete the connection.
				LdapConnectionManager.removeConnection(LdapConnectionManager.getConnection(name));
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
			createAttributesWebview(treeItem.getLdapConnection(), treeItem.getDn(), context);
		} else {
			// The command fired from the command palette: treeItem is undefined.
			// Explicitly ask the user for a connection.
			const connectionNames = LdapConnectionManager.getConnections().map(connection => connection.name);
			vscode.window.showQuickPick(connectionNames, { placeHolder: "Select a connection" }).then(name => {
				// If user cancelled the connection quick pick, then do nothing.
				if (name === undefined) {
					return;
				}
				// Otherwise ask the user for a DN.
				vscode.window.showInputBox({ placeHolder: "Enter a DN (e.g. cn=readers,ou=users,dc=example,dc=org)"}).then(dn => {
					// If no DN was provided, then do nothing.
					if (dn === undefined) {
						return;
					}
					// Otherwise show webview with attributes of the DN.
					createAttributesWebview(LdapConnectionManager.getConnection(name), dn, context);
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
