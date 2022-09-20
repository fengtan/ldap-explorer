import { ExtensionContext, ViewColumn, window } from 'vscode';
import { LdapConnection } from '../ldapConnection';
import { getWebviewUiToolkitUri } from './utils';

export function createShowAttributesWebview(ldapConnection: LdapConnection, dn: string, context: ExtensionContext) {
  // Create webview.
  const panel = window.createWebviewPanel(
    'ldap-explorer.show-attributes',
    dn.split(",")[0], // Set webview title to "OU=foobar", not the full DN.
    ViewColumn.One,
    { enableScripts: true }
  );

  // Scope is set to "base" so we only get attributes about the current (base) node https://ldapwiki.com/wiki/BaseObject
  ldapConnection.search({ scope: "base" }, dn).then(
    entries => {
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
        window.showWarningMessage(`Received multiple LDAP entries, expected only one: ${dn}`);
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

    },
    reason => {
      window.showErrorMessage(`Unable to display attributes for dn "${dn}": ${reason}`);
    }
  );
}
