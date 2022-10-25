import { Event, EventEmitter, ExtensionContext, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, workspace } from 'vscode';
import { FakeEntry } from '../FakeEntry';
import { LdapConnectionManager } from '../LdapConnectionManager';

/**
 * Tree provider that lists bookmarks from the current active connection.
 */
export class BookmarkTreeDataProvider implements TreeDataProvider<FakeEntry> {

  private context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  /**
   * {@inheritDoc}
   */
  public getTreeItem(entry: FakeEntry): TreeItem {
    // Create tree item.
    const treeItem = new TreeItem(entry.dn, TreeItemCollapsibleState.None);

    // Set tree item icon.
    treeItem.iconPath = new ThemeIcon("bookmark");

    // Clicking on the bookmark shows its attributes.
    treeItem.command = {
      command: "ldap-explorer.show-attributes",
      title: "Show Attributes",
      arguments: [entry]
    };

    return treeItem;
  }

  /**
   * {@inheritDoc}
   */
  public getChildren(entry?: FakeEntry): Thenable<FakeEntry[]> {
    return new Promise((resolve, reject) => {
      // None of the top-level tree items are expandable i.e. they have no children.
      if (entry) {
        return resolve([]);
      }

      // Get active connection.
      const connection = LdapConnectionManager.getActiveConnection(this.context);
      if (connection === undefined) {
        // No active connection: return empty array.
        return resolve([]);
      }

      // We know we are at the top-level of the tree: return bookmarks.
      return resolve(connection.getBookmarks().map(dn => new FakeEntry(dn)));
    });
  }

  /*
   * Logic to refresh the view.
   *
   * @see https://code.visualstudio.com/api/extension-guides/tree-view#updating-tree-view-content
   */
  private _onDidChangeTreeData: EventEmitter<FakeEntry | undefined | null | void> = new EventEmitter<FakeEntry | undefined | null | void>();
  readonly onDidChangeTreeData: Event<FakeEntry | undefined | null | void> = this._onDidChangeTreeData.event;
  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

}
