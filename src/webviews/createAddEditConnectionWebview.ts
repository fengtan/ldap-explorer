import { commands, ExtensionContext, ViewColumn, window } from 'vscode';
import { LdapConnection } from '../LdapConnection';
import { LdapConnectionManager } from '../LdapConnectionManager';
import { getWebviewUiToolkitUri } from './utils';

// If no connection is passed as argument, then the form will create a new connection.
// If a connection is passed as argument, then the form will edit this connection.
export function createAddEditConnectionWebview(context: ExtensionContext, existingConnection?: LdapConnection) {

  // Create webview.
  const panel = window.createWebviewPanel(
    'ldap-explorer.add-edit-connection',
    existingConnection === undefined ? 'LDAP Explorer: Add new connection' : `LDAP Explorer: Edit connection '${existingConnection.getName()}'`,
    ViewColumn.One,
    { enableScripts: true }
  );

  // We need to include this JS into the webview in order to use the Webview UI toolkit.
  const toolkitUri = getWebviewUiToolkitUri(panel.webview, context.extensionUri);

  // Populate webview content.
  // The VS Code API seems to provide no way to inspect the configuration schema, so make sure all
  // HTML fields listed in the form below match the contributed configuration described in package.json
  // (field labels, types, default values).
  panel.webview.html = `<!DOCTYPE html>
	<html lang="en">
		<head>
			<script type="module" src="${toolkitUri}"></script>
  		</head>
		<body>
			<section>
				<vscode-text-field type="text" id="name" placeholder="My connection" value="${existingConnection?.getName() ?? ''}">Connection name *</vscode-text-field>
			</section>
			<section>
				<p>Protocol *</p>
				<vscode-dropdown id="protocol" value="${existingConnection?.getProtocol(false) ?? 'ldap'}">
					<vscode-option>ldap</vscode-option>
					<vscode-option>ldaps</vscode-option>
				</vscode-dropdown>
			</section>
			<section>
				<vscode-text-field type="text" id="host" placeholder="e.g. example.net" value="${existingConnection?.getHost(false) ?? ''}">Host *</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="port" placeholder="e.g. 389" value="${existingConnection?.getPort(false) ?? ''}">Port (standard: 389 for ldap, 636 for ldaps) *</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="binddn" placeholder="e.g. cn=admin,dc=example,dc=org" value="${existingConnection?.getBindDn(false) ?? ''}">Bind DN</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="bindpwd" value="${existingConnection?.getBindPwd(false) ?? ''}">Bind Password</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="basedn" placeholder="e.g. dc=example,dc=org" value="${existingConnection?.getBaseDn(false) ?? ''}">Base DN *</vscode-text-field>
			</section>
			<section>
				<vscode-text-field type="text" id="timeout" value="${existingConnection?.getTimeout(false) ?? '5000'}">Timeout in milliseconds (leave empty for infinity)</vscode-text-field>
			</section>

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
						basedn: document.getElementById("basedn").value,
						timeout: document.getElementById("timeout").value,
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
        message.name,
        message.protocol,
        message.host,
        message.port,
        message.binddn,
        message.bindpwd,
        message.basedn,
        message.timeout
      );
      switch (message.command) {
      case 'save':
        // Verify mandatory fields are not empty.
        const mandatoryFields = [
          "protocol",
          "host",
          "port",
          "basedn"
        ];
        let emptyMandatoryFields: string[] = [];
        mandatoryFields.forEach(mandatoryField => {
          if (!message[mandatoryField]) {
            emptyMandatoryFields.push(mandatoryField);
          }
        });
        if (emptyMandatoryFields.length > 0) {
          // Show machine name of the fields (e.g. basedn) instead of labels (e.g. Base DN), that looks acceptable.
          window.showErrorMessage(`Empty fields, please provide a value: ${emptyMandatoryFields.join(", ")}`);
          return;
        }

        // Save (either add or update) connection to settings.
        if (existingConnection === undefined) {
          LdapConnectionManager.addConnection(newConnection).then(
            value => {
              // If connection was successfully added, refresh tree view so it shows up.
              commands.executeCommand("ldap-explorer.refresh");
            },
            reason => {
              // If connection could not be added, show error message.
              window.showErrorMessage(`Unable to save new connection: ${reason}`);
            }
          );
        } else {
          LdapConnectionManager.editConnection(newConnection, existingConnection).then(
            value => {
              // If connection was successfully updated, refresh tree view.
              commands.executeCommand("ldap-explorer.refresh");
            },
            reason => {
              // If connection could not be updated, show error message.
              window.showErrorMessage(`Unable to update connection: ${reason}`);
            }
          );
        }

        // Refresh view so the new connection shows up.
        commands.executeCommand("ldap-explorer.refresh");
        break;

      case 'test':
        // Test connection.
        newConnection.search({}).then(
          value => {
            window.showInformationMessage('Connection succeeded');
          },
          reason => {
            window.showErrorMessage(`Connection failed: ${reason}`);
          }
        );
        break;
      }
    },
    undefined,
    context.subscriptions
  );

}
