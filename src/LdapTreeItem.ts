// Represents an item in the tree view (either a connection or an lDAP result).

import { LdapConnection } from "./LdapConnection";
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

export class LdapTreeItem extends TreeItem {

  // @todo remove connection attribute from this class, and load active connection from VSCode global state
  // @todo do we really need a seprate class (LdapTreeItem) ? We don't in LdapConnectionDataProvider, because the case is simple
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

    // Call parent constructor.
    //
    // By default all tree items are expandable, as we cannot determine whether
    // they have children or not just based on their DN.
    //
    // TreeItem does not allow to change the collapsible state after the object
    // has been created, so tree items with no children will appear expandable
    // even if they have no child. No a great UX but we have no choice.
    super(label, TreeItemCollapsibleState.Collapsed);

    // Populate attributes specific to LdapTreeItem (i.e. not inherited from TreeItem).
    this.connection = connection;
    this.dn = dn;

    // Tooltip of the TreeItem:
    // - If the TreeItem is an LDAP result, then show its full DN.
    // - If the TreeItem is a connection, then show its base DN.
    this.tooltip = dn ?? this.connection.getBaseDn(true);

    // Description of the TreeItem:
    // - If the TreeItem is an LDAP result, then show no description.
    // - If the TreeItem is a connection, then show its connection name.
    this.description = dn ? "" : this.connection.getName();
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
    // Make results paged in case the item has more than 1,000 children (many LDAP servers return at most 1,000 results at a time).
    return this.connection.search({ scope: "one", paged: true }, this.getDn()).then(
      entries => {
        return entries.map(entry => new LdapTreeItem(this.connection, entry.dn));
      },
      reason => {
        return Promise.reject(`Unable to get children of ${this.getDn()}: ${reason}`);
      }
    );
  }

}
