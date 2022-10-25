import { Event, EventEmitter, ExtensionContext, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, workspace } from 'vscode';
import { LdapConnectionManager } from '../LdapConnectionManager';

/**
 * Tree provider that lists bookmarks from the current active connection.
 */
export class BookmarkTreeDataProvider implements TreeDataProvider<string> {

  private context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  /**
   * {@inheritDoc}
   */
  public getTreeItem(dn: string): TreeItem {
    // Create tree item.
    const treeItem = new TreeItem(dn, TreeItemCollapsibleState.None);

    // Set tree item icon.
    treeItem.iconPath = new ThemeIcon("bookmark");

    // Clicking on the bookmark shows its attributes.
    treeItem.command = {
      command: "ldap-explorer.show-attributes",
      title: "Show Attributes",
      arguments: [dn]
    };

    return treeItem;
  }

  /**
   * {@inheritDoc}
   */
  public getChildren(dn?: string): Thenable<string[]> {
    return new Promise((resolve, reject) => {
      // None of the top-level tree items are expandable i.e. they have no children.
      if (dn) {
        return resolve([]);
      }

      // Get active connection.
      const connection = LdapConnectionManager.getActiveConnection(this.context);
      if (connection === undefined) {
        // No active connection: return empty array.
        return resolve([]);
      }

      // We know we are at the top-level of the tree: return bookmarks.
      return resolve(connection.getBookmarks());
    });
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
