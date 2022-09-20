// Provides data to the tree view.

import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { LdapConnection } from './LdapConnection';
import { LdapConnectionManager } from './LdapConnectionManager';
import { LocalState } from './LocalState';

export class LdapTreeDataProvider implements TreeDataProvider<string> {

  private localState: LocalState;

  constructor(localState: LocalState) {
    this.localState = localState;
  }

  getTreeItem(dn: string): TreeItem {
    // Set the label of the TreeItem to the left-most part of its DN.
    // For instance given a DN "cn=foo,ou=bar,dc=example,dc=com", show the item as "cn=foo" in the tree view.
    // @todo the top-level item (baseDN) should show its full DN
    const label = dn.split(",")[0];

    // By default all tree items are expandable, as we cannot determine whether
    // they have children or not just based on their DN.
    //
    // TreeItem does not allow to change the collapsible state after the object
    // has been created, so tree items with no children will appear expandable
    // even if they have no child. No a great UX but we have no choice.
    // @todo this TreeDataProvider should also include the objectclass (or the entire SearchEntry) so we can determine whether tree items are expandable or not.
    const collapsibleState = TreeItemCollapsibleState.Collapsed;

    // Instantiate tree item.
    const treeItem = new TreeItem(label, collapsibleState);

    // Set tooltip of the TreeItem to its full DN.
    treeItem.tooltip = dn;

    // @todo set treeItem.description to the connection name (for the top-level tree item) ?

    return treeItem;
  }

  getChildren(dn?: string): Thenable<string[]> {
    return new Promise((resolve, reject) => {
      // Get active connection.
      const connectionName = this.localState.getActiveConnection();
      if (connectionName === undefined) {
        // No connection name stored in state, show nothing.
        // @todo make sure the welcome screen shows up.
        return resolve([]);
      }
      LdapConnectionManager.getConnection(connectionName).then(
        (connection: LdapConnection) => {
          // No DN passed i.e. we are at the root of the tree.
          // Just show the base DN of the active connection.
          if (!dn) {
            return resolve([connection.getBaseDn(true)]);
          }
          // Search and extract DN from LDAP results.
          // @todo also extract object type (or the whole SearchEntry), so we know whether the entry is expandable or not ?
          // Set LDAP search scope of "one" so we get only immediate subordinates of the base DN https://ldapwiki.com/wiki/SingleLevel
          // Make results paged in case the item has more than 1,000 children (many LDAP servers return at most 1,000 results at a time).
          connection.search({ scope: "one", paged: true }, dn).then(
            entries => {
              return resolve(entries.map(entry => entry.dn));
            },
            reason => {
              return reject(`Unable to get children of ${dn}: ${reason}`);
            }
          );
        },
        reason => {
          // @todo add some doc about the context when this happens, drop ?
          return reject(reason);
        }
      );
    });
  }

  // Logic to refresh the view.
  // @see https://code.visualstudio.com/api/extension-guides/tree-view#updating-tree-view-content
  private _onDidChangeTreeData: EventEmitter<string | undefined | null | void> = new EventEmitter<string | undefined | null | void>();

  readonly onDidChangeTreeData: Event<string | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

}
