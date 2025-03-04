import { ExtensionContext, Uri, ViewColumn, window } from 'vscode';
import { LdapConnection } from '../LdapConnection';
import { decodeAttribute, formatCsvLine, getUri, getWebviewUiToolkitUri } from './utils';
import { Attribute, SearchOptions } from 'ldapjs';
import { open, write } from "fs";
import { homedir } from "os";
import { sep } from "path";

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
  const stylesheetUri = getUri(panel.webview, context.extensionUri, ["assets", "css", "styles.css"]);

  // Populate webview HTML with search results.
  panel.webview.html = /* html */ `
    <!DOCTYPE html>
      <html lang="en">
        <head>
          <!-- Webview UI toolkit requires a CSP with unsafe-inline script-src and style-src (not ideal but we have no choice) -->
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${panel.webview.cspSource} 'unsafe-inline'; style-src ${panel.webview.cspSource} 'unsafe-inline';" />
          <script type="module" src="${toolkitUri}"></script>
          <link type="text/css" rel="stylesheet" href="${stylesheetUri}" media="all" />
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

  // Get options for executing the ldap search.
  function getSearchOptions(): SearchOptions {
    return {
      // Defaults to scope "sub" i.e. returns the full substree of the base DN.
      // See https://ldapwiki.com/wiki/WholeSubtree
      scope: "sub",
      paged: true,
      filter: filter,
      attributes: attributes
    };
  }

  // Execute ldap search and populate grid as results are received.
  connection.search({
    context: context,
    searchOptions: getSearchOptions(),
    onSearchEntryFound: (entry) => {
      // Turn LDAP entry into an object that matches the format expected by the grid.
      // The LDAP attribute name will show up in the grid headers and the values will show up in the cells.
      // See https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/src/data-grid/README.md
      const row: any = {};
      entry.attributes.forEach(attribute => {
        row[attribute.type] = decodeAttribute(attribute);
      });
      // Callback that fires when a new search result is found.
      // Send message from extension to webview, tell it to add a row to the grid.
      // See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-an-extension-to-a-webview
      panel.webview.postMessage({
        command: "addRow",
        row: row,
      });
    }
  }).then(
    entries => {
      // Do nothing: onSearchResultFound callback is provided i.e. results are
      // displayed as they are received.
    },
    reason => {
      window.showErrorMessage(`Unable to search with filter "${filter}", attributes "${attributes?.join(', ')}": ${reason}`);
    }
  );

  // Handle messages from the webview to the extension.
  // See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
      case 'export-csv':
        window.showSaveDialog({
          // By default the CSV is named "export.csv" and located in the user's home directory.
          defaultUri: Uri.file(homedir() + sep + "export.csv"),
          saveLabel: "Export",
          title: "Export CSV file"
        }).then(
          uriCSV => {
            // Make sure user provided a file path.
            // If not then just return and do nothing.
            if (uriCSV === undefined) {
              return;
            }
            // Open file for writing.
            open(uriCSV.fsPath, "w", (err, fd) => {
              if (err) {
                window.showErrorMessage(`Unable to open ${uriCSV.fsPath} for writing: ${err}`);
                return;
              }
              // Write CSV headers to the file.
              const attributesToExport: string[] = message.attributesToExport;
              write(fd, formatCsvLine(attributesToExport), (err) => {
                if (err) {
                  window.showErrorMessage(`Unable to write to ${uriCSV.fsPath}: ${err}`);
                }
                // Execute LDAP search.
                connection.search({
                  context: context,
                  searchOptions: getSearchOptions(),
                  onSearchEntryFound: (entry) => {
                    // For each result, format a CSV line and write it to the file.
                    let entryValues: (string | string[])[] = [];
                    attributesToExport.forEach(attributeToExport => {
                      const attributeElemToExport: Attribute | undefined = entry.attributes.find(attribute => attribute.type === attributeToExport);
                      const entryValue = attributeElemToExport ? decodeAttribute(attributeElemToExport).toString() : "";
                      entryValues.push(entryValue);
                    });
                    write(fd, formatCsvLine(entryValues), (err) => {
                      if (err) {
                        window.showErrorMessage(`Unable to append line to ${uriCSV.fsPath}: ${err}`);
                      }
                    });
                  }
                }).then(
                  entries => {
                    // Tell user the export is complete.
                    // Show a button "Open" so the user can immediately read the contents of the CSV.
                    window.showInformationMessage(`Exported CSV to ${uriCSV.fsPath}`, 'Open').then(() => {
                      window.showTextDocument(uriCSV);
                    });
                  },
                  reason => {
                    window.showErrorMessage(`Unable to search with filter "${filter}", attributes "${attributes?.join(', ')}": ${reason}`);
                  }
                );
              });
            });
          },
          reason => {
            window.showErrorMessage(`Unable to export CSV: ${reason}`);
          }
        );
        break;
      }
    },
    undefined,
    context.subscriptions
  );

}
