import * as vscode from 'vscode';
import { LdapProvider } from './provider';

// This method is called when the extension is activated (see activationEvents in package.json).
export function activate(context: vscode.ExtensionContext) {

	// Populate view with our data provider.
	vscode.window.createTreeView('ldap-browser-view', {
		treeDataProvider: new LdapProvider()
	});

	// Implementation of commands defined in package.json.
	context.subscriptions.push(vscode.commands.registerCommand('ldap-browser.add-connection', () => {
		// @todo drop vscode.window.showInformationMessage('Adding a connection');
		// Create webview.
		const panel = vscode.window.createWebviewPanel(
			'ldap-browser.add-connection',
			'LDAP Browser: Add new connection',
			vscode.ViewColumn.One,
			{
				enableScripts: true
			}
		);

		// Populate webview content.
		panel.webview.html = getAddNewConnectionWebviewContent();

		// Handle messages from webview to the extension.
		panel.webview.onDidReceiveMessage(
			message => {
			  switch (message.command) {
				case 'save':
				  vscode.window.showErrorMessage(message.text);
				  return;
			  }
			},
			undefined,
			context.subscriptions
		  );
	}));
	
}

// This method is called when your extension is deactivated.
export function deactivate() {

	// @todo clear provider ? See todo-tree

}

function getAddNewConnectionWebviewContent() {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>LDAP Browser: Add new connection</title>
	</head>
	<body>
		<h1>LDAP Browser: Add new connection</h1>
		<label for="name">Name</label>
		<input type="text" name="name" id="name" />
		<!-- TODO complete form -->
		<button type="button" id="save">Save</button>
		<script>
			const vscode = acquireVsCodeApi();
			document.addEventListener("DOMContentLoaded", function(){
				vscode.postMessage({command: 'save', text: 'foo bar'});
			});
		</script>
	</body>
	</html>`;
}