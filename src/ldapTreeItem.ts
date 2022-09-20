// Represents an item in the tree view (either a connection or an lDAP result).

import { LdapConnection } from "./ldapConnection";
import { getWebviewUiToolkitUri } from "./utilities";
import * as vscode from 'vscode';

export class LdapTreeItem extends vscode.TreeItem {

  private connection: LdapConnection;
  private dn?: string;

  // Parameter "dn" is expected to be set when creating a TreeItem for *LDAP results*.
  // It is not expected to be set for *connections* TreeItems (e.g. top-level TreeItems) as they already include a baseDN.
  constructor(connection: LdapConnection, dn?: string) {
    // Label of the TreeItem:
    // - If the TreeItem is an LDAP result, then show the left-most part of its DN.
    //   For instance given a DN "cn=foo,ou=bar,dc=example,dc=com", show the item as "cn=foo" in the tree view.
    // - If the TreeItem is a connection, then show its connection name.
    const label = dn ? dn.split(",")[0] : connection.basedn;

    // Whether the TreeItem is expandable:
    // - If the TreeItem is an LDAP result, then it is expandable only if its DN does not start with CN
    //   as the latter is not supposed to have children ; other designators (OU, DC) are containers
    //   and may have children in the LDAP hierarchy.
    // - If the TreeItem is a connection, then it is always expandable (and expanding it means opening
    //   the root of LDAP hierarchy).
    const expandable = dn ? !dn.startsWith("cn") : true;
    const collapsibleState = expandable ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
  
    // Call parent cosntructor.
    super(label, collapsibleState);

    // Populate attributes specific to LdapTreeItem (i.e. not inherited from TreeItem).
    this.connection = connection;
    this.dn = dn;

    // Set context value, this is refered to as "viewItem" in "when" clauses in package.json (view/item/context).
    this.contextValue = dn ? "ldap-entry" : "connection";

    // Tooltip of the TreeItem:
    // - If the TreeItem is an LDAP result, then show its full DN.
    // - If the TreeItem is a connection, then show its base DN.
    this.tooltip = dn ?? this.connection.basedn;

    // Description of the TreeItem:
    // - If the TreeItem is an LDAP result, then show no description.
    // - If the TreeItem is a connection, then show its connection string.
    this.description = dn ? "" : this.connection.getUrl();

    // Command to call when the TreeItem is clicked:
    // - If the TreeItem is an LDAP result, then call the command that lists its attributes.
    // - If the TreeItem is a connection, then do nothing.
    if (dn) {
      this.command =  {
        command: "ldap-browser.show-attributes",
        title: "Show Attributes",
        arguments: [this]
      };
    }
  }

  // @todo drop, as well as isExpandable() and getCommand() --> merge with LdapDataProvider, similar to Dependency
  getLdapConnection(): LdapConnection {
    return this.connection;
  }

  // Get children of this tree item.
  getChildren(): Thenable<LdapTreeItem[]> {
    // Search and convert LDAP results into tree items.
    // @todo set additional options ? Second argument of the search() method. Same for search() call in getAttributesHTML()
    // Set LDAP search scope of "one" so we get only immediate subordinates of the base DN https://ldapwiki.com/wiki/SingleLevel
    // @todo we only implement the onfullfilled callback of the thenable here, should probably also implement onRejected
    return this.connection.search({scope: "one"}, this.dn).then(entries => entries.map(entry => new LdapTreeItem(this.connection, entry.dn)));
  }

  // HTML that lists all attributes of this TreeItem.
  // @todo passing the webviewPanel and context as an argument is really, really not a good idea: the two classes should be loosely coupled
  getAttributesHTML(webviewPanel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    // Scope is set to "base" so we only get attributes about the current (base) node https://ldapwiki.com/wiki/BaseObject
    // @todo implement onRejected callback of the thenable
    this.connection.search({scope: "base"}, this.dn).then(entries => {

      // We need to include this JS into the webview in order to use the Webview UI toolkit.
      const toolkitUri = getWebviewUiToolkitUri(webviewPanel.webview, context.extensionUri);

      webviewPanel.webview.html =
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <script type="module" src="${toolkitUri}"></script>
        </head>
        <body>
          <h1>${this.dn}</h1>
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
        vscode.window.showWarningMessage("Received multiple LDAP entries, expected only one: " + this.dn);
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
      webviewPanel.webview.postMessage({
        command: "populate",
        rows: rows
      });

    });
  }

}