// Represents an item in the tree view (either a connection or an lDAP result).

import { LdapConnection } from "./ldapConnection";

export class LdapTreeItem {

  private connection: LdapConnection;
  private dn?: string;

  // Parameter "dn" is expected to be set when creating a TreeItem for *LDAP results*.
  // It is not expected to be set for *connections* TreeItems (e.g. top-level TreeItems) as they already include a baseDN.
  constructor(connection: LdapConnection, dn?: string) {
    this.connection = connection;
    this.dn = dn;
  }

  // Label of the TreeItem:
  // - If the TreeItem is an LDAP result, then show its DN.
  // - If the TreeItem is a connection, then show its connection name.
  getLabel(): string {
    return this.dn ?? this.connection.name;
  }

  // Description of the TreeItem:
  // - If the TreeItem is an LDAP result, then show no description.
  // - If the TreeItem is a connection, then show its connection string.
  getDescription(): string {
    return this.dn ? "" : this.connection.getUrl();
  }

  // Whether the TreeItem is expandable:
  // - If the TreeItem is an LDAP result, then it is expandable only if its DN does not start with CN
  //   as the latter is not supposed to have children ; other designators (OU, DC) are containers
  //   and may have children in the LDAP hierarchy.
  // - If the TreeItem is a connection, then it is always expandable (and expanding it means opening
  //   the root of LDAP hierarchy).
  isExpandable(): boolean {
    return this.dn ? !this.dn.startsWith("cn") : true;
  }

  getCommand(): any {
    return this.dn ? {
      command: "ldap-browser.show-attributes",
      title: "Show Attributes",
        arguments: [this.dn] // @todo should likely pass this instead of this.dn (the command needs the whole connection object in order to connect to the ldap server)
    } : {}; // @todo generates error in console when clicking on connection TreeItem
  }

  // @todo drop, as well as isExpandable() and getCommand() --> merge with LdapDataProvider, similar to Dependency
  getLdapConnection(): LdapConnection {
    return this.connection;
  }

  // DN representing the TreeItem
  // - If the TreeItem is an LDAP result, then this is its regular DN.
  // - If the TreeItem is a connection, then the DN its the base DB configured by the user.
  getDN(): string {
    return this.dn ?? this.connection.basedn;
  }

}