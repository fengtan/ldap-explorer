import { Event, EventEmitter, ExtensionContext, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { LdapConnection } from '../LdapConnection';
import { LdapConnectionManager } from '../LdapConnectionManager';

/**
 * Tree provider that lists LDAP connections.
 */
export class ConnectionTreeDataProvider implements TreeDataProvider<LdapConnection> {

  private context: ExtensionContext;

  public constructor(context: ExtensionContext) {
    this.context = context;
  }

  /**
   * {@inheritDoc}
   */
  public getTreeItem(connection: LdapConnection): TreeItem {
    // Create tree item for this connection.
    const treeItem = new TreeItem(connection.getName(), TreeItemCollapsibleState.None);
    treeItem.description = connection.getUrl();

    // Add icon and tooltip so user knows whether the connection is active.
    const isActive = (connection.getName() === LdapConnectionManager.getActiveConnection(this.context)?.getName());
    treeItem.iconPath = new ThemeIcon(isActive ? 'circle-filled' : 'circle');
    treeItem.tooltip = isActive ? "Active connection" : "Inactive connection";

    // Clicking on the connection activates or deactivates it (and updates the "Tree" view).
    treeItem.command = {
      command: isActive ? "ldap-explorer.deactivate-connection" : "ldap-explorer.activate-connection",
      title: isActive ? "Set active" : "Set inactive",
      arguments: [connection]
    };

    return treeItem;
  }

  /**
   * {@inheritDoc}
   */
  public getChildren(treeItem?: LdapConnection): Thenable<LdapConnection[]> {
    // Top-level tree items: list of connections.
    if (!treeItem) {
      const connections = LdapConnectionManager.getConnections();
      return Promise.resolve(connections);
    }

    // None of the top-level tree items are expandable i.e. they have no children.
    return Promise.resolve([]);
  }

  /*
   * Logic to refresh the view.
   *
   * @see https://code.visualstudio.com/api/extension-guides/tree-view#updating-tree-view-content
   */
  private _onDidChangeTreeData: EventEmitter<LdapConnection | undefined | null | void> = new EventEmitter<LdapConnection | undefined | null | void>();
  readonly onDidChangeTreeData: Event<LdapConnection | undefined | null | void> = this._onDidChangeTreeData.event;
  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

}
