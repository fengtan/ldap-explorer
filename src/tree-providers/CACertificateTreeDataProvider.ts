import { Event, EventEmitter, ExtensionContext, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { CACertificateManager } from '../CACertificateManager';

/**
 * Tree provider that lists CA certificates stored in settings.
 *
 * @todo buttons: refresh/add/edit/delete
 * @todo command palette: refresh/add/edit/delete
 */
export class CACertificateTreeDataProvider implements TreeDataProvider<string> {

  // @todo context not used
  // @todo group commands with subcategories ? Ldap Explorer: CA Certificates
  private context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  /**
   * {@inheritDoc}
   */
  public getTreeItem(cacert: string): TreeItem {
    // Create tree item.
    const treeItem = new TreeItem(cacert, TreeItemCollapsibleState.None);

    // Set tree item icon.
    // @todo command to copy cert location to clipboard
    treeItem.iconPath = new ThemeIcon("lock");

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
