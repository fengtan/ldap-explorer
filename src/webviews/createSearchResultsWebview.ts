import { ExtensionContext, ViewColumn, window } from 'vscode';
import { LdapConnection } from '../LdapConnection';
import { getWebviewUiToolkitUri } from './utils';

// Makes a search query to the LDAP server and shows results in a webview.
export function createSearchResultsWebview(connection: LdapConnection, filter: string, attributes: string[], context: ExtensionContext) {

  // Defaults to scope "sub" i.e. returns the full substree of the base DN.
  // @todo expose scope to end user ?
  // @todo allow paging and max number of entries returned ? infinite scroll ?
  connection.search({ scope: "sub", filter: filter }, connection.getBaseDn(true)).then(
    entries => {
      // Create webview.
      const panel = window.createWebviewPanel(
        'ldap-explorer.search',
        `Results: ${filter}`, // @todo include connection name in title ?
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
						  //grid.columnDefinitions = event.data.columnDefinitions; // @todo
              grid.columnDefinitions = [
						    { columnDataKey: "cn", title: "CN" },
						    { columnDataKey: "objectClass", title: "object class" },
                { columnDataKey: "member", title: "member" }
						  ];
						  // Data (rows).
						  grid.rowsData = event.data.rowsData;
						  break;
					  }
				  });
				</script>
			</html>`;

      // Store columns (attribute names) and rows (values) in arrays.
      let columnDefinitions = new Set<string>();
      let rowsData: string[] = [];
      entries.forEach(searchEntry => {
        searchEntry.attributes.forEach(attribute => {
          columnDefinitions.add(attribute.type);
          // @todo populate rowsData from attribute and searchEntry
        });
      });

      // Send message from extension to webview, tell it to populate the grid.
      // See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-an-extension-to-a-webview
      panel.webview.postMessage({
        command: "populate",
        //columnDefinitions: Array.from(columnDefinitions.values()), @todo
        rowsData: [ // @todo
          {
            cn: "cn1",
            objectClass: "oc1",
            member: "member1"
          },
          {
            cn: "cn2",
            objectClass: "oc2",
            member: "member2"
          },
          {
            cn: "cn3",
            objectClass: "oc3",
            member: "member3"
          },
        ]
      });
    },
    reason => {
      // @todo fails to show when adding a invalid filter (the error shows in console)
      window.showErrorMessage(`Unable to search with filter "${filter}", attributes "${attributes.join(', ')}": ${reason}`);
    }
  );

}
