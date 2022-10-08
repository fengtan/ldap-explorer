import { ExtensionContext, ViewColumn, window } from 'vscode';
import { LdapConnection } from '../LdapConnection';
import { getUri, getWebviewUiToolkitUri } from './utils';

/**
 * Create a webview that shows attributes of a single LDAP entry.
 */
export function createShowAttributesWebview(connection: LdapConnection, dn: string, context: ExtensionContext) {

  // Scope is set to "base" so we only get attributes about the entry provided https://ldapwiki.com/wiki/BaseObject
  connection.search({ scope: "base" }, dn).then(
    entries => {
      // Create webview.
      const panel = window.createWebviewPanel(
        'ldap-explorer.show-attributes',
        dn.split(",")[0], // Set webview title to RDN ("ou=foobar"), not the full DN.
        {
          viewColumn: ViewColumn.One,
          preserveFocus: true
        },
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      // JS required for the Webview UI toolkit https://github.com/microsoft/vscode-webview-ui-toolkit
      const toolkitUri = getWebviewUiToolkitUri(panel.webview, context.extensionUri);

      // JS of the webview.
      const scriptUri = getUri(panel.webview, context.extensionUri, ["assets", "js", "createShowAttributesWebview.js"]);

      // Populate webview HTML with the list of attributes.
      panel.webview.html = /* html */ `
      <!DOCTYPE html>
        <html lang="en">
          <head>
            <!-- Webview UI toolkit requires a CSP with unsafe-inline script-src and style-src (not ideal but we have no choice) -->
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${panel.webview.cspSource} 'unsafe-inline'; style-src ${panel.webview.cspSource} 'unsafe-inline';" />
            <script type="module" src="${toolkitUri}"></script>
          </head>
          <body>
            <h1>${dn}</h1>
            <vscode-data-grid id="grid" generate-header="sticky" aria-label="Attributes" grid-template-columns="1fr 1fr"></vscode-data-grid>
            <script src="${scriptUri}"></script>
          </body>
        </html>
      `;

      // Ensure we received only one LDAP entry.
      // That should always be the case given that the scope of the LDAP query is set to "base" above.
      if (entries.length > 1) {
        window.showWarningMessage(`Received multiple LDAP entries, expected only one: ${dn}`);
      }

      // Build list of rows (1 row = 1 attribute).
      let rowsData: any[] = [];
      entries.forEach(entry => {
        entry.attributes.forEach(attribute => {
          const vals: string[] = Array.isArray(attribute.vals) ? attribute.vals : [attribute.vals];
          vals.forEach(val => {
            rowsData.push({ name: attribute.type, value: val });
          });
        });
      });

      // Send message from extension to webview, tell it to populate the rows of the grid.
      // See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-an-extension-to-a-webview
      panel.webview.postMessage({
        command: "populate",
        rowsData: rowsData
      });

    },
    reason => {
      window.showErrorMessage(`Unable to display attributes for dn "${dn}": ${reason}`);
    }
  );
}
