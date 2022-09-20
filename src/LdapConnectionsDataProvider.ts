import { Event, EventEmitter, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { LdapConnection } from './LdapConnection';
import { LdapConnectionManager } from './LdapConnectionManager';

export class LdapConnectionsDataProvider implements TreeDataProvider<LdapConnection> {

  getTreeItem(connection: LdapConnection): TreeItem {
    const treeItem = new TreeItem(connection.getName(), TreeItemCollapsibleState.None);
    treeItem.description = connection.getUrl();
    // @todo add tooltip (base DN / bind DN ?)
    // @todo add icon so user knows which connection is active (codicon "circle-large", "circle-large-filled") ; to know which connection is active check the VSCode global state
    treeItem.iconPath = new ThemeIcon('circle');
    // @todo depending on globalState, clicking on the treeitem should also deactivate the connection
    // Clicking on the connection activate it (and populates the "Tree" view)
    treeItem.command = {
      command: "ldap-explorer.activate-connection",
      title: "Activate connection",
      arguments: [connection]
    };
    return treeItem;
  }

  getChildren(treeItem?: LdapConnection): Thenable<LdapConnection[]> {
    // Top-level tree items: list of connections.
    if (!treeItem) {
      const connections = LdapConnectionManager.getConnections();
      return Promise.resolve(connections);
    }

    // None of the top-level tree items are expandable i.e. they have no children.
    return Promise.resolve([]);
  }

  // Logic to refresh the view.
  // @see https://code.visualstudio.com/api/extension-guides/tree-view#updating-tree-view-content
  private _onDidChangeTreeData: EventEmitter<LdapConnection | undefined | null | void> = new EventEmitter<LdapConnection | undefined | null | void>();

  readonly onDidChangeTreeData: Event<LdapConnection | undefined | null | void> = this._onDidChangeTreeData.event;

  // @todo creating/editing/deleting connections should call refresh on *this* view (not on the tree view)
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

}
