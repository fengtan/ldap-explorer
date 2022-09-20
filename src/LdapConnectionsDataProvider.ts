import { Event, EventEmitter, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { LdapConnection } from './LdapConnection';
import { LdapConnectionManager } from './LdapConnectionManager';
import { LocalState } from './LocalState';

export class LdapConnectionsDataProvider implements TreeDataProvider<LdapConnection> {

  private localState: LocalState;

  constructor(localState: LocalState) {
    this.localState = localState;
  }

  getTreeItem(connection: LdapConnection): TreeItem {
    const treeItem = new TreeItem(connection.getName(), TreeItemCollapsibleState.None);
    treeItem.description = connection.getUrl();

    // Add icon and tooltip so user knows which connection is active.
    const isActive = (connection.getName() === this.localState.getActiveConnection());
    treeItem.iconPath = new ThemeIcon(isActive ? 'circle-filled' : 'circle');
    treeItem.tooltip = isActive ? "Active connection" : "Inactive connection";

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

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

}
