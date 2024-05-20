import { commands, ExtensionContext, ViewColumn, window } from 'vscode';
import { LdapConnection } from '../LdapConnection';
import { LdapConnectionManager } from '../LdapConnectionManager';
import { getUri, getWebviewUiToolkitUri } from './utils';

/**
 * Create a webview to edit or create a connection.
 *
 * If no connection is provided in the arguments then the form will create a new connection.
 * Otherwise it will edit the connection.
 */
export function createAddEditConnectionWebview(context: ExtensionContext, existingConnection?: LdapConnection) {

  // Create webview.
  const panel = window.createWebviewPanel(
    'ldap-explorer.add-edit-connection',
    existingConnection === undefined ? 'LDAP Explorer: Add new connection' : `LDAP Explorer: Edit connection '${existingConnection.getName()}'`,
    ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  // JS required for the Webview UI toolkit https://github.com/microsoft/vscode-webview-ui-toolkit
  const toolkitUri = getWebviewUiToolkitUri(panel.webview, context.extensionUri);

  // JS of the webview.
  const scriptUri = getUri(panel.webview, context.extensionUri, ["assets", "js", "createAddEditConnectionWebview.js"]);

  // Populate webview HTML.
  // The VS Code API seems to provide no way to inspect the configuration schema (in package.json).
  // So make sure all HTML fields listed in the form below match the contributed
  // configuration described in package.json (field labels, types, default values).
  panel.webview.html = /* html */`
  <!DOCTYPE html>
    <html lang="en">
      <head>
        <!-- Webview UI toolkit requires a CSP with unsafe-inline script-src and style-src (not ideal but we have no choice) -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${panel.webview.cspSource} 'unsafe-inline'; style-src ${panel.webview.cspSource} 'unsafe-inline';" />
        <script type="module" src="${toolkitUri}"></script>
      </head>
      <body>
        <section>
          <vscode-text-field type="text" id="name" placeholder="My connection" value="${existingConnection?.getName() ?? ''}">Connection name *</vscode-text-field>
        </section>
        <section>
          <p>Protocol *</p>
          <vscode-dropdown id="protocol" value="${existingConnection?.getProtocol(false) ?? 'ldap'}" onChange="updateFieldsVisibility()">
            <vscode-option>ldap</vscode-option>
            <vscode-option>ldaps</vscode-option>
          </vscode-dropdown>
        </section>
        <section>
          <vscode-checkbox id="starttls" checked="${existingConnection?.getStartTLS(false) ?? 'false'}" onChange="updateFieldsVisibility()">StartTLS</vscode-checkbox>
        </section>
        <fieldset id="tlsoptions">
          <legend>TLS Options</legend>
          <section>
            <vscode-checkbox id="verifycert" checked="${existingConnection?.getVerifyCert(false) ?? 'true'}">Verify certificate (recommended)</vscode-checkbox>
          </section>
          <section>
            <vscode-text-field type="text" id="sni" placeholder="e.g. example.net" value="${existingConnection?.getSni(false) ?? ''}">Server Name Indication (SNI)</vscode-text-field>
          </section>
        </fieldset>
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
          <vscode-text-field type="password" id="bindpwd" value="${existingConnection?.getBindPwd(false) ?? ''}">Bind Password</vscode-text-field>
        </section>
        <section>
          <vscode-text-field type="text" id="basedn" placeholder="e.g. dc=example,dc=org" value="${existingConnection?.getBaseDn(false) ?? ''}">Base DN *</vscode-text-field>
        </section>
        <section>
          <vscode-text-field type="text" id="limit" value="${existingConnection?.getLimit(false) ?? '0'}">Maximum number of entries to return (set to 0 for unlimited)</vscode-text-field>
        </section>
        <section>
          <vscode-checkbox id="paged" checked="${existingConnection?.getPaged(false) ?? 'true'}">Automatic result paging<small><div>Many LDAP servers enforce limits upon the returned result set (commonly 1,000).</div><div>Enable this option to make sure all results are returned.</div>Disable this option if your server does not support paged results.</div></small></vscode-checkbox>
        </section>
        <section>
          <vscode-text-field type="text" id="timeout" value="${existingConnection?.getTimeout(false) ?? '5000'}">Timeout in milliseconds (leave empty for infinity)</vscode-text-field>
        </section>

        <section>
          <p>All fields except "Connection name" support environment variables. Syntax: <code>$\{my-env-var\}</code>.</p>
        </section>

        <vscode-button onClick="submitForm('save')">Save</vscode-button>
        <vscode-button onClick="submitForm('test')" appearance="secondary">Test</vscode-button>

        <script src="${scriptUri}"></script>
      </body>
    </html>
  `;

  // Handle messages from webview to the extension.
  // See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
  panel.webview.onDidReceiveMessage(
    message => {
      // Build connection object.
      const newConnection = new LdapConnection(
        message.name,
        message.protocol,
        message.starttls,
        message.verifycert,
        message.sni,
        message.host,
        message.port,
        message.binddn,
        message.bindpwd,
        message.basedn,
        message.limit,
        message.paged,
        message.timeout,
        // Bookmarks are not editable via the connection add/edit form.
        // Maintain pre-existing bookarks when editing a connection, and default
        // to empty array when adding a new connection.
        (existingConnection === undefined) ? [] : existingConnection.getBookmarks()
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
          // This will show the machine name of the fields (e.g. "basedn") instead of labels (e.g. "Base DN"), that looks acceptable.
          window.showErrorMessage(`Empty fields, please provide a value: ${emptyMandatoryFields.join(", ")}`);
          return;
        }

        // Save (either add or update) connection to VS Code settings.
        if (existingConnection === undefined) {

          // Verify connection name does not already exist.
          if (LdapConnectionManager.getConnection(newConnection.getName())) {
            window.showErrorMessage(`A connection named "${newConnection.getName()} already exists, please pick a different name`);
            return;
          }

          LdapConnectionManager.addConnection(newConnection).then(
            value => {
              // If the connection was successfully added, then refresh the tree view so it shows up.
              commands.executeCommand("ldap-explorer.refresh");
              // Tell the user that the connection was created.
              window.showInformationMessage(`Saved connection ${newConnection.getName()}`);
            },
            reason => {
              // If the connection could not be added, then show error message.
              window.showErrorMessage(`Unable to save new connection: ${reason}`);
            }
          );
        } else {
          LdapConnectionManager.editConnection(newConnection, existingConnection.getName()).then(
            value => {
              // If the connection was successfully updated, then refresh the tree view.
              commands.executeCommand("ldap-explorer.refresh");
              // Tell the user the connection was updated.
              window.showInformationMessage(`Saved connection ${newConnection.getName()}`);

              // Also update the name of the existing connection as this field is used to identify connections.
              // This allows the user to change the name of the connection multiple times in the same webview.
              existingConnection.setName(newConnection.getName());
            },
            reason => {
              // If connection could not be updated, then show error message.
              window.showErrorMessage(`Unable to update connection: ${reason}`);
            }
          );
        }
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
