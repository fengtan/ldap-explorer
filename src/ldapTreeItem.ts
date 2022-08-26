// Represents an item in the tree view (either a connection or an lDAP result).

import { LdapConnection } from "./ldapConnection";
import * as vscode from 'vscode';

export class LdapTreeItem extends vscode.TreeItem {

  private connection: LdapConnection;
  private dn?: string;

  // Parameter "dn" is expected to be set when creating a TreeItem for *LDAP results*.
  // It is not expected to be set for *connections* TreeItems (e.g. top-level TreeItems) as they already include a baseDN.
  constructor(connection: LdapConnection, dn?: string) {
    // Label of the TreeItem:
    // - If the TreeItem is an LDAP result, then show its DN.
    // - If the TreeItem is a connection, then show its connection name.
    const label = dn ?? connection.name;

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

    // Description of the TreeItem:
    // - If the TreeItem is an LDAP result, then show no description.
    // - If the TreeItem is a connection, then show its connection string.
    this.description = this.dn ? "" : this.connection.getUrl();

    // Command to call when the TreeItem is clicked:
    // - If the TreeItem is an LDAP result, then call the command that lists its attributes.
    // - If the TreeItem is a connection, then do nothing.
    if (this.dn) {
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

      // @todo using an intermediate variable attrs is ugly - find something more elegant
      // @todo log warning if entries has > 1 items, it is not supposed to
      let attrs: string[] = [];
      entries.forEach(entry => {
        entry.attributes.forEach(attribute => {
          const vals: string[] = Array.isArray(attribute.vals) ? attribute.vals : [attribute.vals];
          vals.forEach(val => {
            attrs.push("<li>" + attribute.type + ": " + val + "</li>"); // @todo attribute.toString() ?
          });
        });
      });

      const toolkitUri = this.getUri(webviewPanel.webview, context.extensionUri, [
        "node_modules",
        "@vscode",
        "webview-ui-toolkit",
        "dist",
        "toolkit.js",
      ]);
  

      webviewPanel.webview.html =
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <script type="module" src="${toolkitUri}"></script>
        </head>
        <body>
          <h1>${this.dn}</h1>
          <!-- TODO the is probably is nicer way to render a table -->
          <ul>
            ${attrs.join("\n")}
          </ul>

          <vscode-data-grid aria-label="Basic">
  <vscode-data-grid-row row-type="header">
    <vscode-data-grid-cell cell-type="columnheader" grid-column="1">Header 1</vscode-data-grid-cell>
    <vscode-data-grid-cell cell-type="columnheader" grid-column="2">Header 2</vscode-data-grid-cell>
    <vscode-data-grid-cell cell-type="columnheader" grid-column="3">Header 3</vscode-data-grid-cell>
    <vscode-data-grid-cell cell-type="columnheader" grid-column="3">Header 4</vscode-data-grid-cell>
  </vscode-data-grid-row>
  <vscode-data-grid-row>
    <vscode-data-grid-cell grid-column="1">Cell Data</vscode-data-grid-cell>
    <vscode-data-grid-cell grid-column="2">Cell Data</vscode-data-grid-cell>
    <vscode-data-grid-cell grid-column="3">Cell Data</vscode-data-grid-cell>
    <vscode-data-grid-cell grid-column="4">Cell Data</vscode-data-grid-cell>
  </vscode-data-grid-row>
  <vscode-data-grid-row>
    <vscode-data-grid-cell grid-column="1">Cell Data</vscode-data-grid-cell>
    <vscode-data-grid-cell grid-column="2">Cell Data</vscode-data-grid-cell>
    <vscode-data-grid-cell grid-column="3">Cell Data</vscode-data-grid-cell>
    <vscode-data-grid-cell grid-column="4">Cell Data</vscode-data-grid-cell>
  </vscode-data-grid-row>
  <vscode-data-grid-row>
    <vscode-data-grid-cell grid-column="1">Cell Data</vscode-data-grid-cell>
    <vscode-data-grid-cell grid-column="2">Cell Data</vscode-data-grid-cell>
    <vscode-data-grid-cell grid-column="3">Cell Data</vscode-data-grid-cell>
    <vscode-data-grid-cell grid-column="4">Cell Data</vscode-data-grid-cell>
  </vscode-data-grid-row>
</vscode-data-grid>
        </body>
      </html>`;
    });
  }

  // @todo rename / move somewhere else ?
  getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]) {
    return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
  }

}