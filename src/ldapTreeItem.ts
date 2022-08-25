// Represents an item in the tree view (either a connection or an lDAP result).

import { LdapConnection } from "./ldapConnection";
import * as ldapjs from 'ldapjs'; // @todo may not need to import *
import * as vscode from 'vscode';

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

  // Get children of this tree item.
  getChildren(): Thenable<LdapTreeItem[]> {
    return new Promise((resolve, reject) => {

      // Create LDAP object.
      const client = ldapjs.createClient({
        url: [this.connection.getUrl()]
      });

      // Bind.
      client.bind(this.connection.binddn, this.connection.bindpwd, (err) => {
        if (err) {
          // @todo same comments as client.on below.
          console.log(err); // @todo drop ?
          vscode.window.showErrorMessage(`Error when binding: ${err}`); // @todo no, should throw exception and handle error in LdapDataProvider.ts, this class should only be about ldapjs, not about VS Code UI
          client.destroy(); // @todo should destroy client at any other place where we handle an error
          return resolve([]); // @todo should reject() instead of resolve([])
        }

        // Prepare the DN we will query.
        // - If the TreeItem is an LDAP result, then we will query its regular DN.
        // - If the TreeItem is a connection, then we will query the base DN configured by the user.
        const dn = this.dn ?? this.connection.basedn;
        // Search.
        // @todo set additional options ? Second argument of the search() method
        // @todo clean this messy search() call - should call reject() or resolve() etc
        // Set LDAP search scope of "one" so we get only immediate subordinates of the base DN https://ldapwiki.com/wiki/SingleLevel
        client.search(dn, {"scope": "one"}, (err, res) => {
          console.log(err); // @todo handle and return if there is an error
  
          let results: LdapTreeItem[] = [];
          res.on('searchRequest', (searchRequest) => {
            console.log('searchRequest: ', searchRequest.messageID);
          });
          res.on('searchEntry', (entry) => {
            results.push(new LdapTreeItem(this.connection, entry.dn)); // @todo best to show only the OU/CN name instead of the full DN ? For UX
            console.log('entry: ' + JSON.stringify(entry.object));
          });
          res.on('searchReference', (referral) => {
            console.log('referral: ' + referral.uris.join());
          });
          res.on('error', (err) => {
            console.error('error: ' + err.message);
          });
          res.on('end', (result) => {
            // @todo verify status is 0 ?
            console.log('status: ' + result!.status);
            return resolve(results);
          });
        });

        // @todo should unbind somewhere (maybe in a callback) see https://github.com/ldapjs/node-ldapjs/issues/428
      });
    });


    /*
    @todo uncomment ?
    client.on('error', (err) => {
      // @todo wording (find something better than just "Error: XX")
      // @todo handle different types of error ? http://ldapjs.org/errors.html
      // @todo test (when host is invalid, when bind dn does not work, when password does not work, etc)
      console.log(err);
      vscode.window.showErrorMessage(`Error (regular): ${err}`);
      return Promise.resolve([]);
    });
    */    
  }

}