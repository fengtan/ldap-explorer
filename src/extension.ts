import * as vscode from 'vscode';
import { LdapConnectionManager } from './ldapConnectionManager';
import { LdapDataProvider } from './ldapDataProvider';
import { LdapTreeItem } from './ldapTreeItem';
import { createAttributesWebview, createAddConnectionWebview } from './webviews';

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
			// treeItem is defined only if the command fired from the contextual menu of the tree view.
			const connection = treeItem.getLdapConnection();
			LdapConnectionManager.removeConnection(connection);
		} else {
			// If the command fired from the command palette then treeItem is undefined so we explicitly ask the user to pick a connection.
			const connectionNames = LdapConnectionManager.getConnections().map(connection => connection.name);
			vscode.window.showQuickPick(connectionNames, { placeHolder: "Connection to delete." }).then(name => {
				// If no connection was selected, then do nothing.
				if (name === undefined) {
					return;
				}
				// Otherwise delete the connection.
				const connection = LdapConnectionManager.getConnection(name);
				LdapConnectionManager.removeConnection(connection);
			});
		}
	}));

	// Implement "Refresh" command (refreshes the tree view).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.refresh-view', () => {
		ldapDataProvider.refresh();
	}));

	// Implement "Show attributes" command (show attributes of the DN in a webview).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.show-attributes', (treeItem: LdapTreeItem) => {
		createAttributesWebview(treeItem.getLdapConnection(), treeItem.getDn(), context);
	}));

	// @todo is it necessary to pass all registered commands through context.subscriptions.push() ?
	
}

// This method is called when your extension is deactivated.
export function deactivate() {

	// @todo clear provider ? See todo-tree
	// @todo unbind all connections http://ldapjs.org/client.html#unbind

}
