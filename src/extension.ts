import * as vscode from 'vscode';
import { LdapProvider } from './provider';

// This method is called when the extension is activated.
// The extension is activated when the view is shown (see activationEvents in package.json).
export function activate(context: vscode.ExtensionContext) {

	// Populate view with our data provider.
	vscode.window.createTreeView('ldap-browser-view', {
		treeDataProvider: new LdapProvider()
	});

	// Implementation of commands defined in package.json.
	context.subscriptions.push(vscode.commands.registerCommand('ldap-browser.add-connection', () => {
		// @todo drop vscode.window.showInformationMessage('Adding a connection');
		const panel = vscode.window.createWebviewPanel(
			'ldap-browser.add-connection',
			'LDAP browser: Add new connection',
			vscode.ViewColumn.One,
			{}
		);
	}));
	
}

// This method is called when your extension is deactivated.
export function deactivate() {

	// @todo clear provider ? See todo-tree

}
