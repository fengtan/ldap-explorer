import * as vscode from 'vscode';
import { LdapProvider } from './provider';

// This method is called when the extension is activated.
// The extension is activated when the view is shown (see activationEvents in package.json).
export function activate(context: vscode.ExtensionContext) {
	
	// @todo drop
	console.log('test activate');

	vscode.window.createTreeView('ldap-browser-view', {
		treeDataProvider: new LdapProvider()
	});
	
}

// This method is called when your extension is deactivated.
export function deactivate() {

	// @todo clear provider ? See todo-tree
	console.log('test deactivate');


}
