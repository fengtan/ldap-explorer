// Provides data to the tree view.

// @todo unused ?

import * as vscode from 'vscode';

export class LdapProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    return Promise.resolve([new vscode.TreeItem("foo bar")]);
  }

}