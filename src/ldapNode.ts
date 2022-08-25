// Represents an item in the tree view (either a connection or an lDAP result).

import { LdapConnection } from "./ldapConnection";

export interface LdapNode {

  // Label that should show in the tree view.
  getLabel(): string;
  
  // Description that should show in the tree view.
  getDescription(): string;

  // LDAP Connection that relates to this node.
  getLdapConnection(): LdapConnection;

  // DN (distinguished name) of this node.
  getDN(): string;

  // Whether this node is expandable or not in the tree view.
  isExpandable(): boolean;

  // Command to run when item is clicked in tree view.
  getCommand(): any; // @todo any

  // @todo merge ldapResult.ts and ldapConnection.ts really, they are almost the same.

}