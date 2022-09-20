import * as vscode from 'vscode';
import { LdapConnectionManager } from './ldapConnectionManager';
import { LdapConnection } from './ldapConnection';
import { LdapDataProvider } from './ldapDataProvider';
import { LdapTreeItem } from './ldapTreeItem';
import { getWebviewUiToolkitUri } from "./utilities";

// This method is called when the extension is activated (see activationEvents in package.json).
export function activate(context: vscode.ExtensionContext) {

	// Populate view with our data provider.
	const ldapDataProvider = new LdapDataProvider();
	vscode.window.createTreeView('ldap-explorer-view', {treeDataProvider: ldapDataProvider});

	// Implement "Add connection" command (declared in package.json).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.add-connection', () => {
		// Create webview.
		const panel = vscode.window.createWebviewPanel(
			'ldap-explorer.add-connection',
			'LDAP Explorer: Add new connection',
			vscode.ViewColumn.One,
			{
				enableScripts: true
			}
		);

		// Populate webview content.
		panel.webview.html = getAddNewConnectionHTML(panel, context);

		// Handle messages from webview to the extension.
		// See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
		panel.webview.onDidReceiveMessage(
			message => {
				// Build connection object.
				const connection = new LdapConnection(
					message.name,
					message.protocol,
					message.host,
					message.port,
					message.binddn,
					message.bindpwd,
					message.basedn
				);
				switch (message.command) {
					case 'save':
						// Save connection to settings.
						LdapConnectionManager.addConnection(connection);

						// Refresh view so the new connection shows up.
						// @todo focus on tree view (in case it was not open) ?
				  		vscode.commands.executeCommand("ldap-explorer.refresh-view");

						// @todo UX: message "connection was added to your settings" (along with JSON object and location of the settings file i.e. whether it was stored in global or workspace settings)
				  		return;

					case 'test':
						// Test connection.
						connection.search({scope: "one"}).then(
							value => {
								vscode.window.showInformationMessage('Connection succeeded');
							},
							reason => {
								vscode.window.showErrorMessage('Connection failed: ' + reason);
							}
						);
			  	}
			},
			undefined,
			context.subscriptions
		  );
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

	// Implement "Show attributes" command (details attributes of an LDAP result).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.show-attributes', (treeItem: LdapTreeItem) => {
		// Create webview.
		const panel = vscode.window.createWebviewPanel(
			'ldap-explorer.show-attributes',
			treeItem.label?.toString() ?? "LDAP Explorer",
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

// @todo drop these arguments, this makes no sense
function getAddNewConnectionHTML(webviewPanel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
	// @todo ideally generate the form by inspecting package.json configuration contribution

	// We need to include this JS into the webview in order to use the Webview UI toolkit.
	const toolkitUri = getWebviewUiToolkitUri(webviewPanel.webview, context.extensionUri);

	return `<!DOCTYPE html>
	<html lang="en">
		<head>
			<script type="module" src="${toolkitUri}"></script>
  		</head>
		<body>
			<section>
				<vscode-text-field type="text" id="name" autofocus>Connection name</vscode-text-field>
			</section>
			<section>
				<p>Protocol</p>
				<vscode-dropdown id="protocol">
					<vscode-option>ldap</vscode-option>
					<vscode-option>ldaps</vscode-option>
				</vscode-dropdown>
			</section>
			<section>
				<vscode-text-field type="text" id="host" autofocus>Host</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="port" autofocus>Port</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="binddn" autofocus>Bind DN</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="bindpwd" autofocus>Bind Password</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="basedn" autofocus>Base DN</vscode-text-field>
			</section>

			<!-- TODO add spacing between form elements -->
			<!-- TODO complain if the connection name submitted already exists (must be unique) -->
			<!-- TODO some form elements should be mandatory -->
			<!-- TODO set defaults (same as those defined in package.json) -->
			<vscode-button onClick="submitForm('save')">Save</vscode-button>
			<vscode-button onClick="submitForm('test')" appearance="secondary">Test</vscode-button>
			<script>
				const vscode = acquireVsCodeApi();
				function submitForm(command) {
					vscode.postMessage({
						command: command,
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
