// Provides data to the tree view.

import * as vscode from 'vscode';
import { LdapConnectionManager } from './ldapConnectionManager';
import { LdapNode } from './ldapNode';
import * as ldapjs from 'ldapjs'; // @todo may not need to import *

export class LdapDataProvider implements vscode.TreeDataProvider<LdapNode> {

  getTreeItem(node: LdapNode): vscode.TreeItem {
    const collapsiblestate = node.isExpandable() ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
    let item = new vscode.TreeItem(node.getLabel(), collapsiblestate);
    item.description = node.getDescription();
    item.command = node.getCommand();
    return item;
  }

  getChildren(node?: LdapNode): Thenable<LdapNode[]> {
    // No element passed i.e. we are at the root of the tree.
    // Build list of connections from settings.
    if (!node) {
      return Promise.resolve(LdapConnectionManager.getConnections().map(connection => new LdapNode(connection)));
    }

    // A valid element was passed i.e. we need to list the LDAP nodes (CN, OU, etc) of this parent.
    const connection = node.getLdapConnection();
    return new Promise((resolve, reject) => {
      // Create LDAP object.
      const client = ldapjs.createClient({
        url: [connection.getUrl()]
      });

      // Bind.
      client.bind(connection.binddn, connection.bindpwd, (err) => {
        if (err) {
          // @todo same comments as client.on below.
          console.log(err); // @todo drop ?
          vscode.window.showErrorMessage(`Error when binding: ${err}`);
          client.destroy(); // @todo should destroy client at any other place where we handle an error
          return resolve([]); // @todo should reject() instead of resolve([])
        }

        // Search.
        // @todo set additional options ? Second argument of the search() method
        // @todo clean this messy search() call - should call reject() or resolve() etc
        // Set LDAP search scope of "one" so we get only immediate subordinates of the base DN https://ldapwiki.com/wiki/SingleLevel
        client.search(node.getDN(), {"scope": "one"}, (err, res) => {
          console.log(err); // @todo handle and return if there is an error
  
          let results: LdapNode[] = [];
          res.on('searchRequest', (searchRequest) => {
            console.log('searchRequest: ', searchRequest.messageID);
          });
          res.on('searchEntry', (entry) => {
            results.push(new LdapNode(connection, entry.dn)); // @todo best to show only the OU/CN name instead of the full DN ? For UX
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

  // Logic to refresh the view.
  // @see https://code.visualstudio.com/api/extension-guides/tree-view#updating-tree-view-content
  private _onDidChangeTreeData: vscode.EventEmitter<LdapNode | undefined | null | void> = new vscode.EventEmitter<LdapNode | undefined | null | void>();

  readonly onDidChangeTreeData: vscode.Event<LdapNode | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

}
