import * as vscode from 'vscode';
import { LdapConnectionManager } from './ldapConnectionManager';
import { LdapConnection } from './ldapConnection';
import { LdapDataProvider } from './ldapDataProvider';
import { LdapTreeItem } from './ldapTreeItem';

// This method is called when the extension is activated (see activationEvents in package.json).
export function activate(context: vscode.ExtensionContext) {

	// Populate view with our data provider.
	const ldapDataProvider = new LdapDataProvider();
	vscode.window.createTreeView('ldap-browser-view', {treeDataProvider: ldapDataProvider});

	// Implement "Add connection" command (declared in package.json).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-browser.add-connection', () => {
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
		panel.webview.html = getAddNewConnectionHTML();

		// Handle messages from webview to the extension.
		// See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
		panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'save':
						// Add new connection.
						const connection = new LdapConnection(
							message.name,
							message.protocol,
							message.host,
							message.port,
							message.binddn,
							message.bindpwd,
							message.basedn
						);
						LdapConnectionManager.addConnection(connection);

						// Refresh view so the new connection shows up.
						// @todo focus on tree view (in case it was not open) ?
				  		vscode.commands.executeCommand("ldap-browser.refresh-view");

						// @todo UX: message "connection was added to your settings" (along with JSON object and location of the settings file i.e. whether it was stored in global or workspace settings)
				  		return;
			  	}
			},
			undefined,
			context.subscriptions
		  );
	}));

	// Implement "Delete connection" command.
	context.subscriptions.push(vscode.commands.registerCommand('ldap-browser.delete-connection', (treeItem: LdapTreeItem) => {
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
				vscode.commands.executeCommand("ldap-browser.refresh-view");
			}
		});
	}));

	// Implement "Refresh" command (refreshes the tree view).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-browser.refresh-view', () => {
		ldapDataProvider.refresh();
	}));

	// Implement "Show attributes" command (details attributes of an LDAP result).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-browser.show-attributes', (treeItem: LdapTreeItem) => {
		// Create webview.
		const panel = vscode.window.createWebviewPanel(
			'ldap-browser.show-attributes',
			treeItem.label?.toString() ?? "LDAP Browser",
			vscode.ViewColumn.One,
			{
				enableScripts: true,
			}	  
		);
		
		// Populate webview content.
		treeItem.getAttributesHTML(panel, context);
	}));

	// @todo is it necessary to pass all registered commands through context.subscriptions.push() ?
	
}

// This method is called when your extension is deactivated.
export function deactivate() {

	// @todo clear provider ? See todo-tree
	// @todo unbind all connections http://ldapjs.org/client.html#unbind

}

function getAddNewConnectionHTML() {
	// @todo ideally generate the form by inspecting package.json configuration contribution
	return `<!DOCTYPE html>
	<html lang="en">
		<body>
			<label for="name">Connection name</label>
			<input type="text" name="name" id="name"/>

			<label for="protocol">Protocol</label>
			<select name="protocol" id="protocol">
				<option value="ldap">ldap</option>
				<option value="ldaps">ldaps</option>
			</select>

			<label for="host">Host</label>
			<input type="text" name="host" id="host"/>

			<label for="port">Port</label>
			<input type="text" name="port" id="port"/>

			<label for="binddn">Bind DN</label>
			<input type="text" name="binddn" id="binddn"/>

			<label for="bindpwd">Bind password</label>
			<input type="text" name="bindpwd" id="bindpwd"/>

			<label for="basedn">Base DN</label>
			<input type="text" name="basedn" id="basedn"/>

			<!-- TODO complete form -->
			<!-- TODO complain if the connection name submitted already exists (must be unique) -->
			<!-- TODO some form elements should be mandatory -->
			<!-- TODO set defaults (same as those defined in package.json) -->
			<button type="button" onClick="save()">Save</button>
			<script>
				const vscode = acquireVsCodeApi();
				function save() {
					vscode.postMessage({
						command: 'save',
						name: document.getElementById("name").value,
						protocol: document.getElementById("protocol").value,
						host: document.getElementById("host").value,
						port: document.getElementById("port").value,
						binddn: document.getElementById("binddn").value,
						bindpwd: document.getElementById("bindpwd").value,
						basedn: document.getElementById("basedn").value
					});
				}
			</script>
		</body>
	</html>`;
}