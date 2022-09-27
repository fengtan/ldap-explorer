// Provides data to the tree view.
// Each SearchEntry is a tree item

import { SearchEntry } from 'ldapjs';
import { Event, EventEmitter, ExtensionContext, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, workspace } from 'vscode';
import { LdapConnectionManager } from '../LdapConnectionManager';
import { FakeEntry } from '../FakeEntry';

export class EntryTreeDataProvider implements TreeDataProvider<SearchEntry | FakeEntry> {

  private context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  getTreeItem(entry: SearchEntry | FakeEntry): TreeItem {
    // Whether the user wants to show icons or not.
    const showIcons = workspace.getConfiguration('ldap-explorer').get('show-tree-item-icons', false);

    // Get display DN
    // - For fake entries (base DN) display the full DN (e.g. ou=foobar,dc=example,dc=org)
    // - For regular entries (search results), display the relative RDN (e.g. ou=foobar)
    const displayDn = (entry instanceof FakeEntry) ? entry.dn : entry.dn.split(",")[0];

    // Get entity type (e.g. "ou") and entity name (e.g. "foobar").
    // If displayDn is "ou=foobar" then the entity type is "ou" and the entity name is "foobar".
    const [entityType, entityName] = displayDn.split(/[=,]/);

    // Set the label of the TreeItem.
    // If the user wants to show icons, then only show the entity name ; otherwise show the entire DN.
    const label = showIcons ? entityName : displayDn;

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

    // Set icon depending on the LDAP naming attribute in the lowest RDN of the entry.
    if (showIcons) {
      let icon: string;
      switch (entityType) {
      case "dc":
      case "c":
      case "o":
      case "ou":
        icon = "organization";
        break;
      case "cn":
        icon = "person";
        break;
      default:
        icon = "primitive-square";
      }
      treeItem.iconPath = new ThemeIcon(icon);
    }

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
