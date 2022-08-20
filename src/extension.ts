import * as vscode from 'vscode';
import { LdapProvider } from './provider';

// This method is called when the extension is activated.
export function activate(context: vscode.ExtensionContext) {
	
	// @todo drop
	console.log('test activate');

	// @todo uncomment
	/*vscode.window.createTreeView('ldap-browser-view', {
		treeDataProvider: new LdapProvider()
	});*/
	
}

// This method is called when your extension is deactivated.
export function deactivate() {

	// @todo clear provider ? See todo-tree
	console.log('test deactivate');


}
