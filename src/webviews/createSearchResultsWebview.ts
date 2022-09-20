import { ExtensionContext, ViewColumn, window } from 'vscode';
import { getWebviewUiToolkitUri } from './utils';

// Makes a search query to the LDAP server and shows results in a webview.
export function createSearchResultsWebview(context: ExtensionContext, filter: string) {

  // Create webview.
  const panel = window.createWebviewPanel(
    'ldap-explorer.search',
    `LDAP Explorer: ${filter}`, // @todo include connection name in title ?
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
				  <h1>${filter}</h1><!-- TODO include connection name in h1 ? -->
				  <vscode-data-grid id="grid" aria-label="Search results"></vscode-data-grid>
				  <script>
				  // Populate grid in webview when receiving data from the extension.
				  window.addEventListener('message', event => {
					  switch (event.data.command) {
					  case 'populate':
						  const grid = document.getElementById("grid");
						  // Column titles.
						  grid.columnDefinitions = [
						    { columnDataKey: "dn", title: "DN" },
						    { columnDataKey: "value", title: "Value" },
						  ];
						  // Data (rows).
						  grid.rowsData = event.data.rows;
						  break;
					  }
				  });
				</script>
			</html>`;

  // Send message from extension to webview, tell it to populate the rows of the grid.
  // See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-an-extension-to-a-webview
  panel.webview.postMessage({
    command: "populate",
    rows: [ // @todo dummy values
      {
        dn: "foo",
        value: "bar",
      },
      {
        dn: "dnz",
        value: "valuez"
      }
    ]
  });

}
