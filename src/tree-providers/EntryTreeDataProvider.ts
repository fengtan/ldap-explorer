// Provides data to the tree view.
// Each SearchEntry is a tree item

import { SearchEntry } from 'ldapjs';
import { Event, EventEmitter, ExtensionContext, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { LdapConnectionManager } from '../LdapConnectionManager';
import { FakeEntry } from '../FakeEntry';

export class EntryTreeDataProvider implements TreeDataProvider<SearchEntry | FakeEntry> {

  private context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
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
    const collapsibleState = TreeItemCollapsibleState.Collapsed;

    // Instantiate tree item.
    const treeItem = new TreeItem(label, collapsibleState);

    // Set tooltip of the TreeItem to its full DN.
    treeItem.tooltip = entry.dn;

    // Clicking on the entry shows its attribute.
    treeItem.command = {
      command: "ldap-explorer.show-attributes",
      title: "Show attributes",
      arguments: [entry.dn]
    };

    return treeItem;
  }

  getChildren(entry?: SearchEntry | FakeEntry): Thenable<SearchEntry[] | FakeEntry[]> {
    return new Promise((resolve, reject) => {
      // Get active connection.
      const connection = LdapConnectionManager.getActiveConnection(this.context);
      if (connection === undefined) {
        // No active connection: return empty array.
        return resolve([]);
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
