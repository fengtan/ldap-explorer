import * as vscode from 'vscode';
import { LdapConnection } from './ldapConnection';
import { LdapConnectionManager } from './ldapConnectionManager';

// If no connection is passed as argument, then the form will create a new connection.
// If a connection is passed as argument, then the form will edit this connection.
export function createAddEditConnectionWebview(context: vscode.ExtensionContext, existingConnection?: LdapConnection) {

	// @todo ideally generate the form by inspecting package.json configuration contribution

    // Create webview.
    const panel = vscode.window.createWebviewPanel(
        'ldap-explorer.add-edit-connection',
        existingConnection === undefined ? 'LDAP Explorer: Add new connection' : 'LDAP Explorer: Edit connection' ,
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    // We need to include this JS into the webview in order to use the Webview UI toolkit.
	const toolkitUri = getWebviewUiToolkitUri(panel.webview, context.extensionUri);

    // Populate webview content.
    panel.webview.html = `<!DOCTYPE html>
	<html lang="en">
		<head>
			<script type="module" src="${toolkitUri}"></script>
  		</head>
		<body>
			<section>
				<p>Protocol</p>
				<vscode-dropdown id="protocol" value="${existingConnection?.getProtocol() ?? 'ldap'}">
					<vscode-option>ldap</vscode-option>
					<vscode-option>ldaps</vscode-option>
				</vscode-dropdown>
			</section>
			<section>
				<vscode-text-field type="text" id="host" placeholder="e.g. example.net" value="${existingConnection?.getHost() ?? ''}">Host</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="port" placeholder="e.g. 389 or 636" value="${existingConnection?.getPort() ?? ''}">Port</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="binddn" placeholder="e.g. cn=admin,dc=example,dc=org" value="${existingConnection?.getBindDn() ?? ''}">Bind DN</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="bindpwd" value="${existingConnection?.getBindPwd() ?? ''}">Bind Password</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="basedn" placeholder="e.g. dc=example,dc=org" value="${existingConnection?.getBaseDn() ?? ''}">Base DN</vscode-text-field>
			</section>

			<!-- TODO add spacing between form elements -->
			<!-- TODO complain if connection.getName() already exists (must be unique) -->
			<!-- TODO some form elements should be mandatory (do not make binddn and bindpwd mandatory, to support anonymous binds) -->

			<vscode-button onClick="submitForm('save')">Save</vscode-button>
			<vscode-button onClick="submitForm('test')" appearance="secondary">Test</vscode-button>
			<script>
				const vscode = acquireVsCodeApi();
				function submitForm(command) {
					vscode.postMessage({
						command: command,
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

    // Handle messages from webview to the extension.
    // See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
    panel.webview.onDidReceiveMessage(
        message => {
            // Build connection object.
            const newConnection = new LdapConnection(
                message.protocol,
                message.host,
                message.port,
                message.binddn,
                message.bindpwd,
                message.basedn
            );
            switch (message.command) {
                case 'save':
                    // Save (either add or update) connection to settings.
                    if (existingConnection === undefined) {
						LdapConnectionManager.addConnection(newConnection);
					} else {
						LdapConnectionManager.editConnection(newConnection, existingConnection);
					}

                    // Refresh view so the new connection shows up.
                    vscode.commands.executeCommand("ldap-explorer.refresh-view");

                    // @todo UX: message "connection was added to your settings" (along with JSON object and location of the settings file i.e. whether it was stored in global or workspace settings)
                    return;

                case 'test':
                    // Test connection.
                    newConnection.search({}).then(
                        value => {
                            vscode.window.showInformationMessage('Connection succeeded');
                        },
                        reason => {
                            vscode.window.showErrorMessage(`Connection failed: ${reason}`);
                        }
                    );
            }
        },
        undefined,
        context.subscriptions
    );

}

export function createAttributesWebview(ldapConnection: LdapConnection, dn: string, context: vscode.ExtensionContext) {
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
		const toolkitUri = getWebviewUiToolkitUri(panel.webview, context.extensionUri);
	
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
			vscode.window.showWarningMessage(`Received multiple LDAP entries, expected only one: ${dn}`);
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

/**
 * Utility function to get the webview URI of a given file.
 */
 export function getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]) {
    return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
}

/**
 * Utility function to get the URI of the Webview UI toolkit.
 *
 * @see https://github.com/microsoft/vscode-webview-ui-toolkit
 * @todo drop arguments webview + extensionUri, they should not be needed.
 */
export function getWebviewUiToolkitUri(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const pathList: string[] = [
        "node_modules",
        "@vscode",
        "webview-ui-toolkit",
        "dist",
        "toolkit.js",
    ];
    return getUri(webview, extensionUri, pathList);
}