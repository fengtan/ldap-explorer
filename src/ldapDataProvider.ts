// Provides data to the tree view.

import * as vscode from 'vscode';
import { LdapConnectionManager } from './ldapConnectionManager';
import { LdapTreeItem } from './ldapTreeItem';

export class LdapDataProvider implements vscode.TreeDataProvider<LdapTreeItem> {

  getTreeItem(treeItem: LdapTreeItem): vscode.TreeItem {
    // @todo move this logic into LdapTreeItem and just return treeItem (have LdapTreeItem extend TreeItem)
    const collapsiblestate = treeItem.isExpandable() ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
    let item = new vscode.TreeItem(treeItem.getLabel(), collapsiblestate);
    item.description = treeItem.getDescription();
    item.command = treeItem.getCommand();
    return item;
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
  private _onDidChangeTreeData: vscode.EventEmitter<LdapTreeItem | undefined | null | void> = new vscode.EventEmitter<LdapTreeItem | undefined | null | void>();

  readonly onDidChangeTreeData: vscode.Event<LdapTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

}
