import * as vscode from 'vscode';
import { getWebviewUiToolkitUri } from "../utilities";
import { LdapConnection } from '../../ldapConnection';
import { LdapConnectionManager } from '../../ldapConnectionManager';

export function createAddConnectionWebview(context: vscode.ExtensionContext) {

	// @todo ideally generate the form by inspecting package.json configuration contribution

    // Create webview.
    const panel = vscode.window.createWebviewPanel(
        'ldap-explorer.add-connection',
        'LDAP Explorer: Add new connection',
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
                            vscode.window.showErrorMessage(`Connection failed: ${reason}`);
                        }
                    );
            }
        },
        undefined,
        context.subscriptions
    );

}