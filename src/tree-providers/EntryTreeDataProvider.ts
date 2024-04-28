import { SearchEntry } from 'ldapjs';
import { Event, EventEmitter, ExtensionContext, ProviderResult, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, workspace } from 'vscode';
import { LdapConnectionManager } from '../LdapConnectionManager';

/**
 * Tree provider that lists LDAP entries from the active connection.
 */
export class EntryTreeDataProvider implements TreeDataProvider<string> {

  private context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  /**
   * {@inheritDoc}
   */
  public getTreeItem(dn: string): TreeItem {
    // Whether the user wants to show icons or not.
    const showIcons = workspace.getConfiguration('ldap-explorer').get('show-tree-item-icons', false);

    // Get relative DN, i.e. extract "ou=foobar" from "ou=foobar,dc=example,dc=org".
    const rdn = dn.split(",")[0];

    // Get entity type and entity name (i.e. "ou" and "foobar" if the RDN is "ou=foobar").
    const [entityType, entityName] = rdn.split(/[=,]/);

    // Set the label of the TreeItem.
    // - If the user wants to show icons, then only show the entity name ("foobar")
    // - Otherwise show the entire DN ("ou=foobar")
    const label = showIcons ? entityName : rdn;

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
    treeItem.tooltip = dn;

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
  public getChildren(dn?: string): Thenable<string[]> {
    return new Promise((resolve, reject) => {
      // Get active connection.
      const connection = LdapConnectionManager.getActiveConnection(this.context);
      if (connection === undefined) {
        // No active connection: return empty array.
        return resolve([]);
      }

      // No parent item passed i.e. we are at the root of the tree.
      // Just return the base DN of the connection.
      if (!dn) {
        return resolve([connection.getBaseDn(true)]);
      }

      // A parent item was passed i.e. we are not at the top level of the tree.
      // Send a search request to the LDAP server to fetch the children.
      // The LDAP search scope is set to "one" so we only get the immediate subordinates https://ldapwiki.com/wiki/SingleLevel
      connection.search({ scope: "one", paged: connection.getPagedBool(true) }, dn).then(
        (entries: SearchEntry[]) => {
          return resolve(entries.map(entry => entry.dn));
        },
        reason => {
          return reject(`Unable to get children of ${dn}: ${reason}`);
        }
      );
    });
  }

  /**
   * {@inheritDoc}
   *
   * This method must be implemented for TreeItem.reveal() to work.
   */
  public getParent(dn: string): ProviderResult<string> {
    // Given the DN "cn=foo,ou=bar,dc=example", return the parent DN i.e. "ou=bar,dc=example".
    return dn.split(",").slice(1).join(",");
  }

  /*
   * Logic to refresh the view.
   *
   * @see https://code.visualstudio.com/api/extension-guides/tree-view#updating-tree-view-content
   */
  private _onDidChangeTreeData: EventEmitter<string | undefined | null | void> = new EventEmitter<string | undefined | null | void>();
  readonly onDidChangeTreeData: Event<string | undefined | null | void> = this._onDidChangeTreeData.event;
  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

}
