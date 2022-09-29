import { SearchEntry } from 'ldapjs';
import { Event, EventEmitter, ExtensionContext, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, workspace } from 'vscode';
import { LdapConnectionManager } from '../LdapConnectionManager';
import { FakeEntry } from '../FakeEntry';

/**
 * Tree provider that lists LDAP entries from the active connection.
 */
export class EntryTreeDataProvider implements TreeDataProvider<SearchEntry | FakeEntry> {

  private context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  /**
   * {@inheritDoc}
   */
  public getTreeItem(entry: SearchEntry | FakeEntry): TreeItem {
    // Whether the user wants to show icons or not.
    const showIcons = workspace.getConfiguration('ldap-explorer').get('show-tree-item-icons', false);

    // Get display DN:
    // - For fake entries (base DN) display the full DN (e.g. ou=foobar,dc=example,dc=org)
    // - For regular entries (search results), display the relative DN (e.g. ou=foobar)
    const displayDn = (entry instanceof FakeEntry) ? entry.dn : entry.dn.split(",")[0];

    // Get entity type and entity name (i.e. "ou" and "foobar" if the RDN is "ou=foobar").
    const [entityType, entityName] = displayDn.split(/[=,]/);

    // Set the label of the TreeItem.
    // - If the user wants to show icons, then only show the entity name ("foobar")
    // - Otherwise show the entire DN ("ou=foobar")
    const label = showIcons ? entityName : displayDn;

    // By default all tree items are expandable, as we cannot determine whether
    // they have children or not just based on their DN.
    //
    // TreeItem does not allow to change the collapsible state after the object
    // has been created, so all tree items will appear expandable (even those
    // with no child). No a great UX but we seem to have no choice.
    const collapsibleState = TreeItemCollapsibleState.Collapsed;

    // Instantiate tree item.
    const treeItem = new TreeItem(label, collapsibleState);

    // Set tooltip of the TreeItem to its full DN.
    treeItem.tooltip = entry.dn;

    // Set icon depending on the entity type (and whether the user wants to show icons).
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

  /**
   * {@inheritDoc}
   */
  public getChildren(entry?: SearchEntry | FakeEntry): Thenable<SearchEntry[] | FakeEntry[]> {
    return new Promise((resolve, reject) => {
      // Get active connection.
      const connection = LdapConnectionManager.getActiveConnection(this.context);
      if (connection === undefined) {
        // No active connection: return empty array.
        return resolve([]);
      }

      // No parent item passed i.e. we are at the root of the tree.
      // Just make up a single, fake entry with the base DN of the connection.
      if (!entry) {
        return resolve([new FakeEntry(connection.getBaseDn(true))]);
      }

      // A parent item was passed i.e. we are not at the top level of the tree.
      // Send a search request to the LDAP server to fetch the children.
      // The LDAP search scope is set to "one" so we only get the immediate subordinates https://ldapwiki.com/wiki/SingleLevel
      // The results are paged in case the item has more than 1,000 children (many LDAP servers return at most 1,000 results at a time).
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

  /*
   * Logic to refresh the view.
   *
   * @see https://code.visualstudio.com/api/extension-guides/tree-view#updating-tree-view-content
   */
  private _onDidChangeTreeData: EventEmitter<SearchEntry | FakeEntry | undefined | null | void> = new EventEmitter<SearchEntry | FakeEntry | undefined | null | void>();
  readonly onDidChangeTreeData: Event<SearchEntry | FakeEntry | undefined | null | void> = this._onDidChangeTreeData.event;
  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

}
