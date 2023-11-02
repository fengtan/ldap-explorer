import { ExtensionContext, Uri, ViewColumn, window } from 'vscode';
import { LdapConnection } from '../LdapConnection';
import { formatCsvValue, getUri, getWebviewUiToolkitUri } from './utils';
import { open, write } from "fs";
import { homedir } from "os";
import { sep } from "path";

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

      // Custom CSS.
      const stylesheetUri = getUri(panel.webview, context.extensionUri, ["assets", "css", "styles.css"]);

      // Populate webview HTML with the list of attributes.
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
            <h1>${dn}</h1>
            <vscode-data-grid id="grid" generate-header="sticky" aria-label="Attributes" grid-template-columns="1fr 1fr"></vscode-data-grid>
            <vscode-button id="export-csv" appearance="secondary">Export CSV</vscode-button>
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
                  // TODO utils formatCsvLine()
                  const headers: string[] = ["attribute", "value"].map((attributeToExport) => formatCsvValue(attributeToExport));
                  write(fd, headers.join(",") + "\n", (err) => {
                    if (err) {
                      window.showErrorMessage(`Unable to write to ${uriCSV.fsPath}: ${err}`);
                    }
                    // Write attributes to the file.
                    rowsData.forEach((row) => {
                      const line = formatCsvValue(row.name) + "," + formatCsvValue(row.value) + "\n";
                      write(fd, line, (err) => {
                        window.showErrorMessage(`Unable to append line to ${uriCSV.fsPath}: ${err}`);
                      });
                    });
                  });
                  // Tell user the export is complete.
                  // Show a button "Open" so the user can immediately read the contents of the CSV.
                  window.showInformationMessage(`Exported CSV to ${uriCSV.fsPath}`, 'Open').then(() => {
                    window.showTextDocument(uriCSV);
                  });
                });
              },
              reason => {
                window.showErrorMessage(`Unable to export CSV: ${reason}`);
              }
            );
            // TODO merge commits
            // TODO also support exporting from list view (single ldap entry)
            // TODO precommit fails
            break;
          }
        },
        undefined,
        context.subscriptions
      );

    },
    reason => {
      window.showErrorMessage(`Unable to display attributes for dn "${dn}": ${reason}`);
    }
  );

}
