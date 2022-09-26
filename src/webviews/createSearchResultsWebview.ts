import { ExtensionContext, ViewColumn, window } from 'vscode';
import { LdapConnection } from '../LdapConnection';
import { getWebviewUiToolkitUri } from './utils';

// Makes a search query to the LDAP server and shows results in a webview.
export function createSearchResultsWebview(context: ExtensionContext, connection: LdapConnection, filter: string, attributes?: string[]) {

  // Defaults to scope "sub" i.e. returns the full substree of the base DN.
  connection.search({ scope: "sub", paged: true, filter: filter, attributes: attributes }, connection.getBaseDn(true)).then(
    entries => {
      const title: string = `Search results: ${filter}`;
      // Create webview.
      const panel = window.createWebviewPanel(
        'ldap-explorer.search',
        title,
        ViewColumn.One,
        {
          enableScripts: true
        }
      );

      // Webview UI toolkit.
      const toolkitUri = getWebviewUiToolkitUri(panel.webview, context.extensionUri);

      // Populate webview content with search results.
      panel.webview.html =
        `<!DOCTYPE html>
			<html lang="en">
				<head>
				  <script type="module" src="${toolkitUri}"></script>
				</head>
				<body>
				  <h1>${title}</h1>
				  <vscode-data-grid id="grid" generate-header="sticky" aria-label="Search results"></vscode-data-grid>
				  <script>
				  // Populate grid in webview when receiving data from the extension.
				  window.addEventListener('message', event => {
					  switch (event.data.command) {
					  case 'populate':
						  const grid = document.getElementById("grid");
						  // Column titles.
						  grid.columnDefinitions = event.data.columnDefinitions;
						  // Data (rows).
						  grid.rowsData = event.data.rowsData;
						  break;
					  }
				  });
				</script>
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
