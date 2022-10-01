import { SearchEntry } from 'ldapjs';
import { commands, env, ExtensionContext, window } from 'vscode';
import { FakeEntry } from './FakeEntry';
import { LdapConnection } from './LdapConnection';
import { LdapConnectionManager } from './LdapConnectionManager';
import { BookmarkTreeDataProvider } from './tree-providers/BookmarkTreeDataProvider';
import { ConnectionTreeDataProvider } from './tree-providers/ConnectionTreeDataProvider';
import { EntryTreeDataProvider } from './tree-providers/EntryTreeDataProvider';
import { createAddEditConnectionWebview } from './webviews/createAddEditConnectionWebview';
import { createShowAttributesWebview } from './webviews/createShowAttributesWebview';
import { SearchWebviewViewProvider } from './webviews/SearchWebviewViewProvider';

/**
 * This method is called when the extension is activated (see activationEvents in package.json).
 */
export function activate(context: ExtensionContext) {

  // Create our views (connections, tree, bookmarks, search).

  const connectionTreeDataProvider = new ConnectionTreeDataProvider(context);
  context.subscriptions.push(window.createTreeView('ldap-explorer-view-connections', { treeDataProvider: connectionTreeDataProvider }));

  const entryTreeDataProvider = new EntryTreeDataProvider(context);
  context.subscriptions.push(window.createTreeView('ldap-explorer-view-tree', { treeDataProvider: entryTreeDataProvider }));

  const bookmarkTreeDataProvider = new BookmarkTreeDataProvider(context);
  context.subscriptions.push(window.createTreeView('ldap-explorer-view-bookmarks', { treeDataProvider: bookmarkTreeDataProvider }));

  const searchWebviewViewProvider = new SearchWebviewViewProvider(context);
  context.subscriptions.push(
    window.registerWebviewViewProvider('ldap-explorer-view-search', searchWebviewViewProvider)
  );

  // Implement VS Code commands.
  // Where they show up is defined in package.json ("commands" and "menus").
  // They should all be listed under "activationEvents" in package.json, otherwise
  // calling them from the command palette would break if the extension is not loaded.

  context.subscriptions.push(commands.registerCommand('ldap-explorer.add-connection', () => {
    createAddEditConnectionWebview(context);
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.edit-connection', async (connection?: LdapConnection) => {
    // connection may not be defined (e.g. if the command fired from the command palette instead of the tree view).
    // If that is the case we explictly ask the user to pick a connection.
    if (!connection) {
      connection = await pickConnection();
      // User did not provide a connection: cancel command.
      if (!connection) {
        return;
      }
    }

    // Create webview to edit connection.
    createAddEditConnectionWebview(context, connection);
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.delete-connection', async (connection?: LdapConnection) => {
    // connection may not be defined (e.g. if the command fired from the command palette instead of the tree view).
    // If that is the case we explictly ask the user to pick a connection.
    if (!connection) {
      connection = await pickConnection();
      // User did not provide a connection: cancel command.
      if (!connection) {
        return;
      }
    }

    // Remove connection.
    askAndRemoveConnection(connection);
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.activate-connection', async (connection?: LdapConnection) => {
    // connection may not be defined (e.g. if the command fired from the command palette instead of the tree view).
    // If that is the case we explictly ask the user to pick a connection.
    if (!connection) {
      connection = await pickConnection();
      // User did not provide a connection: cancel command.
      if (!connection) {
        return;
      }
    }

    // Store name of new active connection in Memento.
    LdapConnectionManager.setActiveConnection(context, connection).then(() => {
      // Refresh views so the new active connection shows up.
      commands.executeCommand("ldap-explorer.refresh");
    });
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.deactivate-connection', () => {
    // Set no active connection.
    LdapConnectionManager.setNoActiveConnection(context).then(() => {
      // Refresh views so the new active connection shows up.
      commands.executeCommand("ldap-explorer.refresh");
    });
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.refresh', () => {
    // Refresh all views.
    connectionTreeDataProvider.refresh();
    entryTreeDataProvider.refresh();
    bookmarkTreeDataProvider.refresh();
  }));

  // Copy DN of an entry to the system clipboard.
  // This command does not show in the command palette (it fires from the tree view)
  // so we are guaranteed to be provided with a non-null entry as an argument.
  context.subscriptions.push(commands.registerCommand('ldap-explorer.copy-dn', (entry: SearchEntry | FakeEntry) => {
    env.clipboard.writeText(entry.dn);
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.show-attributes', async (entry?: SearchEntry | FakeEntry) => {
    // If there is no active connection, then explicitly ask user to pick one.
    const connection = LdapConnectionManager.getActiveConnection(context) ?? await pickConnection();

    // User did not provide a connection: cancel command.
    if (!connection) {
      return;
    }

    // 'entry' may not be defined (e.g. if the command fired from the command palette instead of the tree view).
    // If that is the case we explictly ask the user to enter a DN.
    let dn: string | undefined;
    if (!entry) {
      dn = await pickDN();
      // User did not provide a DN: cancel command.
      if (!dn) {
        return;
      }
    }
    else {
      dn = entry.dn;
    }

    // Create webview with attributes of the DN.
    createShowAttributesWebview(connection, dn, context);
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.add-bookmark', async (entry?: SearchEntry | FakeEntry) => {
    // If there is no active connection, then explicitly ask user to pick one.
    const connection = LdapConnectionManager.getActiveConnection(context) ?? await pickConnection();

    // User did not provide a connection: cancel command.
    if (!connection) {
      return;
    }

    // 'entry' may not be defined (e.g. if the command fired from the command palette instead of the tree view).
    // If that is the case we explictly ask the user to enter a DN.
    let dn: string | undefined;
    if (!entry) {
      dn = await pickDN();
      // User did not provide a DN: cancel command.
      if (!dn) {
        return;
      }
    }
    else {
      dn = entry.dn;
    }

    // Add bookmark.
    connection.addBookmark(dn);

    // Persist bookmark in connection.
    LdapConnectionManager.editConnection(connection, connection.getName());

    // Refresh bookmarks view so the new bookmark shows up.
    bookmarkTreeDataProvider.refresh();
  }));

  // This command does not show in the command palette (it fires from the tree view)
  // so we are guaranteed to be provided with a non-null DN as an argument.
  context.subscriptions.push(commands.registerCommand('ldap-explorer.delete-bookmark', async (dn: string) => {
    // If there is no active connection, then explicitly ask user to pick one.
    const connection = LdapConnectionManager.getActiveConnection(context) ?? await pickConnection();

    // User did not provide a connection: cancel command.
    if (!connection) {
      return;
    }

    // Remove bookmark.
    connection.deleteBookmark(dn);

    // Persist removal of the bookmark from the connection.
    LdapConnectionManager.editConnection(connection, connection.getName());

    // Refresh bookmarks view so the bookmark goes away.
    bookmarkTreeDataProvider.refresh();
  }));

}

/**
 * Opens input box asking the user to enter a DN.
 */
async function pickDN(): Promise<string | undefined> {
  return await window.showInputBox({ placeHolder: "Enter a DN (e.g. cn=readers,ou=users,dc=example,dc=org)" });
}

/**
 * Opens quick pick box asking the user to select a connection.
 */
async function pickConnection(): Promise<LdapConnection | undefined> {
  const options = LdapConnectionManager.getConnections().map(connection => {
    return {
      label: connection.getName(),
      description: connection.getUrl(),
      name: connection.getName(),
    };
  });
  const option = await window.showQuickPick(options, { placeHolder: "Select a connection" });

  // If user cancelled the connection quick pick, then do nothing.
  if (option === undefined) {
    return undefined;
  }

  // Otherwise return connection object.
  return LdapConnectionManager.getConnection(option.name);
}

/**
 * Ask for a confirmation and actually remove a connection from settings.
 */
function askAndRemoveConnection(connection: LdapConnection) {
  window.showInformationMessage(`Are you sure you want to remove the connection '${connection.getName()} ?`, { modal: true }, "Yes").then(confirm => {
    if (confirm) {
      LdapConnectionManager.removeConnection(connection).then(
        value => {
          // If connection was successfully removed, refresh tree view so it does not show up anymore.
          commands.executeCommand("ldap-explorer.refresh");
        },
        reason => {
          // If connection could not be removed, show error message.
          window.showErrorMessage(`Unable to remove connection: ${reason}`);
        }
      );
    }
  });
};

/**
 * This method is called when the extension is deactivated.
 */
export function deactivate() { }
