import * as vscode from 'vscode';
import { LdapConnectionManager } from './ldapConnectionManager';
import { LdapDataProvider } from './ldapDataProvider';
import { LdapTreeItem } from './ldapTreeItem';
import { createAttributesWebview, createAddConnectionWebview } from './webviews';

// This method is called when the extension is activated (see activationEvents in package.json).
export function activate(context: vscode.ExtensionContext) {

	// Populate view with our data provider.
	const ldapDataProvider = new LdapDataProvider();
	vscode.window.createTreeView('ldap-explorer-view', {treeDataProvider: ldapDataProvider});

	// Implement "Add connection" command (declared in package.json).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.add-connection', () => {
		createAddConnectionWebview(context);
	}));

	// Implement "Delete connection" command.
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.delete-connection', (treeItem: LdapTreeItem) => {
		// Extract name of the connection to be deleted.
		// This will work only if the command fired from the contextual menu in the tree view.
		// If the command fired from the command palette then 'treeItem' is empty.
		// This is why the command is configured to not show up in the command palette (see package.json).
		const connection = treeItem.getLdapConnection();

		// Ask for confirmation.
		vscode.window.showInformationMessage(`Are you sure you want to remove the connection '${connection.name}' ?`, { modal: true}, "Yes").then((confirm) => {
			if (confirm) {
				// Remove the connection from settings.
				LdapConnectionManager.removeConnection(connection);
				// Refresh view so the connection does not show up anymore.
				// @todo refresh does not seem to work right: if I add a new connection then it does not automatically show up in the view
				vscode.commands.executeCommand("ldap-explorer.refresh-view");
			}
		});
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
