import { existsSync } from 'fs';
import { Event, EventEmitter, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { CACertificateManager } from '../CACertificateManager';

/**
 * Tree provider that lists CA certificates stored in settings.
 */
export class CACertificateTreeDataProvider implements TreeDataProvider<string> {

  /**
   * {@inheritDoc}
   */
  public getTreeItem(cacert: string): TreeItem {
    // Create tree item.
    const treeItem = new TreeItem(cacert, TreeItemCollapsibleState.None);

    // Set tree item icon (lock).
    // If the file does not exist, then indicate there is a problem by setting
    // the icon to a warning and leaving a message in the item's tooltip.
    if (existsSync(cacert)) {
      treeItem.iconPath = new ThemeIcon("lock");
    } else {
      treeItem.iconPath = new ThemeIcon("warning");
      treeItem.tooltip = "This file does not exist.";
    }

    // Clicking on the certificate opens it in the editor.
    const filename = cacert.replace(/^.*[\\\/]/, '');
    treeItem.command = {
      command: "vscode.open",
      title: filename,
      arguments: [cacert]
    };

    return treeItem;
  }

  /**
   * {@inheritDoc}
   */
  public getChildren(cacert?: string): Thenable<string[]> {
    return new Promise((resolve, reject) => {
      // None of the top-level tree items are expandable i.e. they have no children.
      if (cacert) {
        return resolve([]);
      }

      // We know we are at the top-level of the tree: return certs.
      return resolve(CACertificateManager.getCACerts());
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
