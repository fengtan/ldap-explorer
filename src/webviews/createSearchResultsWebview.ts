import { ExtensionContext, ViewColumn, window } from 'vscode';
import { LdapConnection } from '../LdapConnection';
import { getUri, getWebviewUiToolkitUri } from './utils';

/**
 * Create a webview that shows results of an LDAP search query.
 */
export function createSearchResultsWebview(context: ExtensionContext, connection: LdapConnection, filter: string, attributes?: string[]) {

  // Defaults to scope "sub" i.e. returns the full substree of the base DN https://ldapwiki.com/wiki/WholeSubtree
  connection.search({ scope: "sub", paged: true, filter: filter, attributes: attributes }, connection.getBaseDn(true)).then(
    entries => {
      const title: string = `Search results: ${filter}`;
      // Create webview.
      const panel = window.createWebviewPanel(
        'ldap-explorer.search',
        title,
        {
          viewColumn: ViewColumn.One,
          preserveFocus: true
        },
        {
          enableScripts: true,
          retainContextWhenHidden: true // @todo remove and switch to state restore
        }
      );

      // JS required for the Webview UI toolkit https://github.com/microsoft/vscode-webview-ui-toolkit
      const toolkitUri = getWebviewUiToolkitUri(panel.webview, context.extensionUri);

      // JS of the webview.
      const scriptUri = getUri(panel.webview, context.extensionUri, ["assets", "createSearchResultsWebview.js"]);

      // Populate webview HTML with search results.
      panel.webview.html =
        `<!DOCTYPE html>
			<html lang="en">
				<head>
          <!-- Webview UI toolkit requires a CSP with unsafe-inline style-src (not ideal but we have no choice) -->
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${panel.webview.cspSource}; style-src ${panel.webview.cspSource} 'unsafe-inline';" />
				  <script type="module" src="${toolkitUri}"></script>
				</head>
				<body>
				  <h1>${title}</h1>
				  <vscode-data-grid id="grid" generate-header="sticky" aria-label="Search results"></vscode-data-grid>
				  <script src="${scriptUri}"></script>
        </body>
			</html>`;

      // Store columns (attribute names) and rows (values) in arrays.
      let attributeNames: string[] = [];
      let rowsData: any[] = [];
      entries.forEach(searchEntry => {
        let rowData: any = {};
        searchEntry.attributes.forEach(attribute => {
          const attributeName = attribute.type;
          // Populate attributeNames and make sure the names are unique.
          if (!attributeNames.includes(attributeName)) {
            attributeNames.push(attributeName);
          }
          // Prepare row with attribute values.
          // If this attribute is multivalued then join the values with a comma.
          rowData[attributeName] = Array.isArray(attribute.vals) ? attribute.vals.join(', ') : attribute.vals;
        });
        // Add row.
        rowsData.push(rowData);
      });

      // Send message from extension to webview, tell it to populate the grid.
      // See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-an-extension-to-a-webview
      panel.webview.postMessage({
        command: "populate",
        columnDefinitions: attributeNames.map((attributeName) => {
          return {
            "columnDataKey": attributeName
          };
        }),
        rowsData: rowsData
      });
    },
    reason => {
      window.showErrorMessage(`Unable to search with filter "${filter}", attributes "${attributes?.join(', ')}": ${reason}`);
    }
  );

}
