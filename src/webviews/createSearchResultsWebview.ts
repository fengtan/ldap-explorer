import { Attribute } from 'ldapjs';
import { ExtensionContext, ViewColumn, window } from 'vscode';
import { LdapConnection } from '../LdapConnection';
import { getUri, getWebviewUiToolkitUri } from './utils';

/**
 * Create a webview that shows results of an LDAP search query.
 */
export function createSearchResultsWebview(context: ExtensionContext, connection: LdapConnection, filter: string, attributes?: string[]) {

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
      retainContextWhenHidden: true
    }
  );

  // JS required for the Webview UI toolkit https://github.com/microsoft/vscode-webview-ui-toolkit
  const toolkitUri = getWebviewUiToolkitUri(panel.webview, context.extensionUri);

  // JS of the webview.
  const scriptUri = getUri(panel.webview, context.extensionUri, ["assets", "js", "createSearchResultsWebview.js"]);

  // Populate webview HTML with search results.
  panel.webview.html = /* html */ `
    <!DOCTYPE html>
      <html lang="en">
        <head>
          <!-- Webview UI toolkit requires a CSP with unsafe-inline script-src and style-src (not ideal but we have no choice) -->
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${panel.webview.cspSource} 'unsafe-inline'; style-src ${panel.webview.cspSource} 'unsafe-inline';" />
          <script type="module" src="${toolkitUri}"></script>
        </head>
        <body>
          <h1>${title}</h1>
          <vscode-data-grid id="grid" generate-header="sticky" aria-label="Search results"></vscode-data-grid>
          <script src="${scriptUri}"></script>
        </body>
      </html>
    `;

  // Defaults to scope "sub" i.e. returns the full substree of the base DN https://ldapwiki.com/wiki/WholeSubtree
  connection.search(
    { scope: "sub", paged: true, filter: filter, attributes: attributes },
    connection.getBaseDn(true),
    entry => {
      // Turn LDAP entry into an object that matches the format expected by the grid.
      // The LDAP attribute name will show up in the grid headers and the values will show up in the cells.
      // See https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/src/data-grid/README.md
      const row: any = {};
      entry.attributes.forEach(attribute => {
        row[attribute.type] = attribute.vals;
      });
      // Callback that fires when a new search result is found.
      // Send message from extension to webview, tell it to add a row to the grid.
      // See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-an-extension-to-a-webview
      panel.webview.postMessage({
        command: "addRow",
        row: row,
      });
    }
  ).then(
    entries => {
      // Do nothing: onSearchResultFound callback is provided i.e. results are
      // displayed as they are received.
    },
    reason => {
      window.showErrorMessage(`Unable to search with filter "${filter}", attributes "${attributes?.join(', ')}": ${reason}`);
    }
  );

}
