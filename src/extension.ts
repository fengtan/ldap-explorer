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
		panel.webview.html = getAddNewConnectionHTML(panel.webview, context.extensionUri);

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
						connection.search({}).then(
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

	// Implement "Show attributes" command (show attributes of the DN in a webview).
	context.subscriptions.push(vscode.commands.registerCommand('ldap-explorer.show-attributes', (treeItem: LdapTreeItem) => {
		showAttributesInWebview(treeItem.getLdapConnection(), treeItem.getDn(), context.extensionUri);
	}));

	// @todo is it necessary to pass all registered commands through context.subscriptions.push() ?
	
}

// This method is called when your extension is deactivated.
export function deactivate() {

	// @todo clear provider ? See todo-tree
	// @todo unbind all connections http://ldapjs.org/client.html#unbind

}

function showAttributesInWebview(ldapConnection: LdapConnection, dn: string, extensionUri: vscode.Uri) {
	// Create webview.
	const panel = vscode.window.createWebviewPanel(
		'ldap-explorer.show-attributes',
		dn ?? "LDAP Explorer", // @todo title should be cn=foobar, not the full DN
		vscode.ViewColumn.One,
		{
			enableScripts: true,
		}	  
	);

	// Scope is set to "base" so we only get attributes about the current (base) node https://ldapwiki.com/wiki/BaseObject
	// @todo implement onRejected callback of the thenable
	ldapConnection.search({scope: "base"}, dn).then(entries => {
	
		// We need to include this JS into the webview in order to use the Webview UI toolkit.
		const toolkitUri = getWebviewUiToolkitUri(panel.webview, extensionUri);
	
		panel.webview.html =
		  `<!DOCTYPE html>
		  <html lang="en">
			<head>
			  <script type="module" src="${toolkitUri}"></script>
			</head>
			<body>
			  <h1>${dn}</h1>
			  <vscode-data-grid id="grid" aria-label="Attributes" grid-template-columns="1fr 7fr"></vscode-data-grid>
			  <script>
			  // Populate grid in webview when receiving data from the extension.
			  window.addEventListener('message', event => {
				switch (event.data.command) {
				  case 'populate':
					const grid = document.getElementById("grid");
					// Column titles.
					grid.columnDefinitions = [
					  { columnDataKey: "name", title: "Attribute" },
					  { columnDataKey: "value", title: "Value" },
					];
					// Data (rows).
					grid.rowsData = event.data.rows;
					break;
				}
			  });
			  </script>
		  </html>`;
	
		// Make sure we received only one LDAP entry.
		// That should always be the case given that the scope of the LDAP query is set to "base" above.
		if (entries.length > 1) {
			vscode.window.showWarningMessage("Received multiple LDAP entries, expected only one: " + dn);
		}
	
		// Build list of rows (1 row = 1 attribute).
		let rows: any[] = [];
		entries.forEach(entry => {
			entry.attributes.forEach(attribute => {
				const vals: string[] = Array.isArray(attribute.vals) ? attribute.vals : [attribute.vals];
			  	vals.forEach(val => {
					rows.push({ name: attribute.type, value: val });
			  	});
			});
		});
	
		// Send message from extension to webview, tell it to populate the rows of the grid.
		// See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-an-extension-to-a-webview
		panel.webview.postMessage({
			command: "populate",
			rows: rows
		});
	
	});
}

// @todo drop these arguments, this makes no sense
function getAddNewConnectionHTML(webview: vscode.Webview, extensionUri: vscode.Uri) {
	// @todo ideally generate the form by inspecting package.json configuration contribution

	// We need to include this JS into the webview in order to use the Webview UI toolkit.
	const toolkitUri = getWebviewUiToolkitUri(webview, extensionUri);

	return `<!DOCTYPE html>
	<html lang="en">
		<head>
			<script type="module" src="${toolkitUri}"></script>
  		</head>
		<body>
			<section>
				<vscode-text-field type="text" id="name" placeholder="e.g. My connection" autofocus>Connection name</vscode-text-field>
			</section>
			<section>
				<p>Protocol</p>
				<vscode-dropdown id="protocol">
					<vscode-option>ldap</vscode-option>
					<vscode-option>ldaps</vscode-option>
				</vscode-dropdown>
			</section>
			<section>
				<vscode-text-field type="text" id="host" placeholder="e.g. example.net">Host</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="port" placeholder="e.g. 389 or 636">Port</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="binddn" placeholder="e.g. cn=admin,dc=example,dc=org">Bind DN</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="bindpwd">Bind Password</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="basedn" placeholder="e.g. dc=example,dc=org">Base DN</vscode-text-field>
			</section>

			<!-- TODO add spacing between form elements -->
			<!-- TODO complain if the connection name submitted already exists (must be unique) -->
			<!-- TODO some form elements should be mandatory -->

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
