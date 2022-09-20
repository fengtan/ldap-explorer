// Represents an item in the tree view (either a connection or an lDAP result).

import { LdapConnection } from "./ldapConnection";
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

export class LdapTreeItem extends TreeItem {

  private connection: LdapConnection;
  private dn?: string;

  // Parameter "dn" is expected to be set when creating a TreeItem for *LDAP results*.
  // It is not expected to be set for *connections* TreeItems (e.g. top-level TreeItems) as they already include a baseDN.
  constructor(connection: LdapConnection, dn?: string) {
    // Label of the TreeItem:
    // - If the TreeItem is an LDAP result, then show the left-most part of its DN.
    //   For instance given a DN "cn=foo,ou=bar,dc=example,dc=com", show the item as "cn=foo" in the tree view.
    // - If the TreeItem is a connection, then show its base DN.
    const label = dn ? dn.split(",")[0] : connection.getBaseDn(true);

    // Whether the TreeItem is expandable:
    // - If the TreeItem is an LDAP result, then it is expandable only if its DN does not start with CN
    //   as the latter is not supposed to have children ; other designators (OU, DC) are containers
    //   and may have children in the LDAP hierarchy.
    // - If the TreeItem is a connection, then it is always expandable (and expanding it means opening
    //   the root of LDAP hierarchy).
    const expandable = dn ? !dn.toLowerCase().startsWith("cn") : true;
    const collapsibleState = expandable ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None;
  
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
    this.tooltip = dn ?? this.connection.getBaseDn(true);

    // Description of the TreeItem:
    // - If the TreeItem is an LDAP result, then show no description.
    // - If the TreeItem is a connection, then show its connection string.
    this.description = dn ? "" : this.connection.getUrl();

    // If the TreeItem is not expandable (e.g. CN entry), then clicking on this item should call the command that lists its attributes.
    // Othewise (e.g. connection or OU entry), do not set any command: clicking on the tree item will fall back to expanding the item.
    if (!expandable) {
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
    return this.dn ?? this.connection.getBaseDn(true);
  }

  // Get children of this tree item.
  getChildren(): Thenable<LdapTreeItem[]> {
    // Search and convert LDAP results into tree items.
    // Set LDAP search scope of "one" so we get only immediate subordinates of the base DN https://ldapwiki.com/wiki/SingleLevel
    return this.connection.search({scope: "one"}, this.getDn()).then(
      entries => {
        return entries.map(entry => new LdapTreeItem(this.connection, entry.dn));
      },
      reason => {
        return Promise.reject(`Unable to get children of ${this.getDn()}: ${reason}`);
      }
    );
  }

}
