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
        command: "ldap-explorer.show-attributes",
        title: "Show Attributes",
        arguments: [this]
      };
    }
  }

  getLdapConnection(): LdapConnection {
    return this.connection;
  }

  getDn(): string {
    return this.dn ?? this.connection.basedn;
  }

  // Get children of this tree item.
  getChildren(): Thenable<LdapTreeItem[]> {
    // Search and convert LDAP results into tree items.
    // @todo set additional options ? Second argument of the search() method. Same for search() call in getAttributesHTML()
    // Set LDAP search scope of "one" so we get only immediate subordinates of the base DN https://ldapwiki.com/wiki/SingleLevel
    // @todo we only implement the onfullfilled callback of the thenable here, should probably also implement onRejected
    return this.connection.search({scope: "one"}, this.dn).then(entries => entries.map(entry => new LdapTreeItem(this.connection, entry.dn)));
  }

}
