// Provides data to the tree view.

import { Event, EventEmitter, TreeDataProvider, TreeItem } from 'vscode';
import { LdapConnectionManager } from './ldapConnectionManager';
import { LdapTreeItem } from './ldapTreeItem';

export class LdapDataProvider implements TreeDataProvider<LdapTreeItem> {

  getTreeItem(treeItem: LdapTreeItem): TreeItem {
    // LdapTreeItem extends TreeItem so we can just return treeItem.
    return treeItem;
  }

  getChildren(treeItem?: LdapTreeItem): Thenable<LdapTreeItem[]> {
    // No element passed i.e. we are at the root of the tree.
    // Extract list of connections from settings.
    if (!treeItem) {
      const connections = LdapConnectionManager.getConnections();
      return Promise.resolve(connections.map(connection => new LdapTreeItem(connection)));
    }

    // Otherwise get chilren of the TreeItem.
    return treeItem.getChildren();
  }

  // Logic to refresh the view.
  // @see https://code.visualstudio.com/api/extension-guides/tree-view#updating-tree-view-content
  private _onDidChangeTreeData: EventEmitter<LdapTreeItem | undefined | null | void> = new EventEmitter<LdapTreeItem | undefined | null | void>();

  readonly onDidChangeTreeData: Event<LdapTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

}
