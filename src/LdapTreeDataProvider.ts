// Provides data to the tree view.
// Each SearchEntry is a tree item

import { SearchEntry } from 'ldapjs';
import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { LdapConnectionManager } from './LdapConnectionManager';
import { LocalState } from './LocalState';

// A fake LDAP entry i.e. one that is not the result of a LDAP query.
class FakeEntry {

  public dn: string;

  constructor(dn: string) {
    this.dn = dn;
  }

}

export class LdapTreeDataProvider implements TreeDataProvider<SearchEntry | FakeEntry> {

  private localState: LocalState;

  constructor(localState: LocalState) {
    this.localState = localState;
  }

  getTreeItem(entry: SearchEntry | FakeEntry): TreeItem {
    // Set the label of the TreeItem:
    // - For fake entries (base DN) show the full DN
    // - For regular entries (search results), only show the left-most part of its DN
    //   e.g. given a DN "cn=foo,ou=bar,dc=example,dc=com", show the item as "cn=foo"
    const label = (entry instanceof FakeEntry) ? entry.dn : entry.dn.split(",")[0];

    // By default all tree items are expandable, as we cannot determine whether
    // they have children or not just based on their DN.
    //
    // TreeItem does not allow to change the collapsible state after the object
    // has been created, so tree items with no children will appear expandable
    // even if they have no child. No a great UX but we have no choice.
    // @todo determine whether tree items are expandable base on the SearchEntry objectclass
    const collapsibleState = TreeItemCollapsibleState.Collapsed;

    // Instantiate tree item.
    const treeItem = new TreeItem(label, collapsibleState);

    // Set tooltip of the TreeItem to its full DN.
    treeItem.tooltip = entry.dn;

    // @todo clicking on treeItem should show attributes (drop button from package.json)

    return treeItem;
  }

  getChildren(entry?: SearchEntry | FakeEntry): Thenable<SearchEntry[] | FakeEntry[]> {
    return new Promise((resolve, reject) => {
      // Get active connection.
      const connectionName = this.localState.getActiveConnection();
      if (connectionName === undefined) {
        // No connection name stored in state: show nothing.
        // @todo make sure the welcome screen shows up.
        return resolve([]);
      }
      const connection = LdapConnectionManager.getConnection(connectionName);

      if (connection === undefined) {
        return reject(`Unable to get children: unknown connection '${connectionName}'`);
      }

      // No parent entry passed i.e. we are at the root of the tree.
      // Just make up a single entry with the base DN of the active connection.
      if (!entry) {
        return resolve([new FakeEntry(connection.getBaseDn(true))]);
      }
      // Search and extract DN from LDAP results.
      // Set LDAP search scope of "one" so we get only immediate subordinates of the base DN https://ldapwiki.com/wiki/SingleLevel
      // Make results paged in case the item has more than 1,000 children (many LDAP servers return at most 1,000 results at a time).
      return connection.search({ scope: "one", paged: true }, entry.dn).then(
        (entries: SearchEntry[]) => {
          return resolve(entries);
        },
        reason => {
          return reject(`Unable to get children of ${entry.dn}: ${reason}`);
        }
      );
    });
  }

  // Logic to refresh the view.
  // @see https://code.visualstudio.com/api/extension-guides/tree-view#updating-tree-view-content
  private _onDidChangeTreeData: EventEmitter<SearchEntry | FakeEntry | undefined | null | void> = new EventEmitter<SearchEntry | FakeEntry | undefined | null | void>();

  readonly onDidChangeTreeData: Event<SearchEntry | FakeEntry | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

}
