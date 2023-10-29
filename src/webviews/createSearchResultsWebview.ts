import { ExtensionContext, Uri, ViewColumn, window } from 'vscode';
import { LdapConnection } from '../LdapConnection';
import { getUri, getWebviewUiToolkitUri } from './utils';
import { SearchEntry } from 'ldapjs';
import { openSync, writeFileSync } from "fs";

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

  // Custom CSS.
  const stylesheetUri = getUri(panel.webview, context.extensionUri, ["assets", "css", "createSearchResultsWebview.css"]);

  // Codicons CSS.
  const codiconsUri = getUri(panel.webview, context.extensionUri, ['node_modules', '@vscode/codicons', 'dist', 'codicon.css']);

  // Populate webview HTML with search results.
  panel.webview.html = /* html */ `
    <!DOCTYPE html>
      <html lang="en">
        <head>
          <!-- Webview UI toolkit requires a CSP with unsafe-inline script-src and style-src (not ideal but we have no choice) -->
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${panel.webview.cspSource} 'unsafe-inline'; style-src ${panel.webview.cspSource} 'unsafe-inline';" />
          <script type="module" src="${toolkitUri}"></script>
          <link type="text/css" rel="stylesheet" href="${stylesheetUri}" media="all" />
          <!-- TODO 404 "codicon.css does not exist", should import @vscode/codicons -->
          <!--link type="text/css" rel="stylesheet" href="${codiconsUri}" media="all" /-->
        </head>
        <body>
          <h1>${title}</h1>
          <h2 id="counter">0 result</h2>
          <vscode-data-grid id="grid" generate-header="sticky" aria-label="Search results"></vscode-data-grid>
          <vscode-button id="export-csv" appearance="secondary">Export CSV</vscode-button>
          <script src="${scriptUri}"></script>
        </body>
      </html>
    `;

  // Execute ldap search and run a given callback when an entry is found.
  function search(onSearchEntryFound?: ((entry: SearchEntry) => void) | undefined) {
    connection.search(
      // Defaults to scope "sub" i.e. returns the full substree of the base DN https://ldapwiki.com/wiki/WholeSubtree
      { scope: "sub", paged: true, filter: filter, attributes: attributes },
      connection.getBaseDn(true),
      onSearchEntryFound
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

  // Execute ldap search and populate grid as results are received.
  search(entry => {
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
  });

  // Handle messages from the webview to the extension.
  // See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
      case 'export-csv':
        window.showSaveDialog({
          defaultUri: Uri.file("/tmp/export.csv"), // TODO homedir = require('os').homedir(); instead of /tmp
          saveLabel: "Export",
          title: "Export CSV file"
        }).then(
          uriCSV => {
            // TODO write headers to csv
            // TODO w+?
            if (uriCSV === undefined) {
              // TODO is this what happens when the user just does not provide a file path?
              return;
            }
            const fileDescriptor = openSync(uriCSV.fsPath, 'w+');
            search(entry => {
              var line = entry.dn; // TODO populate line with all fields
              writeFileSync(fileDescriptor, line + "\n"); // TODO foobar
            });
            // TODO Ideally write asynchronously as we receive results
            // TODO what if there is an error?
            // TODO test writing to a place that is not writable
            // TODO show confirmation message / error message in vscode end-user interface
            console.log(`now saving to ${uriCSV}`); // TODO build and populate CSV
          },
          reason => {
            console.log(`failure`); // TODO show error
          }
        ); // TODO then save file
        break;
      }
    },
    undefined,
    context.subscriptions
  );

}
