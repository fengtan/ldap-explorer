import { commands, env, ExtensionContext, window } from 'vscode';
import { LdapConnection } from './LdapConnection';
import { LdapConnectionManager } from './LdapConnectionManager';
import { CACertificateTreeDataProvider } from './tree-providers/CACertificateTreeDataProvider';
import { BookmarkTreeDataProvider } from './tree-providers/BookmarkTreeDataProvider';
import { ConnectionTreeDataProvider } from './tree-providers/ConnectionTreeDataProvider';
import { EntryTreeDataProvider } from './tree-providers/EntryTreeDataProvider';
import { createAddEditConnectionWebview } from './webviews/createAddEditConnectionWebview';
import { createShowAttributesWebview } from './webviews/createShowAttributesWebview';
import { SearchWebviewViewProvider } from './webviews/SearchWebviewViewProvider';
import { CACertificateManager } from './CACertificateManager';

/**
 * This method is called when the extension is activated (see activationEvents in package.json).
 */
export function activate(context: ExtensionContext) {

  // Create our views (connections, tree, bookmarks, search).

  const cacertTreeDataProvider = new CACertificateTreeDataProvider();
  const cacertTreeView = window.createTreeView('ldap-explorer-view-cacerts', { treeDataProvider: cacertTreeDataProvider });
  context.subscriptions.push(cacertTreeView);

  const connectionTreeDataProvider = new ConnectionTreeDataProvider(context);
  const connectionTreeView = window.createTreeView('ldap-explorer-view-connections', { treeDataProvider: connectionTreeDataProvider });
  context.subscriptions.push(connectionTreeView);

  const entryTreeDataProvider = new EntryTreeDataProvider(context);
  const entryTreeView = window.createTreeView('ldap-explorer-view-tree', { treeDataProvider: entryTreeDataProvider });
  context.subscriptions.push(entryTreeView);

  const bookmarkTreeDataProvider = new BookmarkTreeDataProvider(context);
  const bookmarkTreeView = window.createTreeView('ldap-explorer-view-bookmarks', { treeDataProvider: bookmarkTreeDataProvider });
  context.subscriptions.push(bookmarkTreeView);

  const searchWebviewViewProvider = new SearchWebviewViewProvider(context);
  context.subscriptions.push(
    window.registerWebviewViewProvider('ldap-explorer-view-search', searchWebviewViewProvider, { webviewOptions: { retainContextWhenHidden: true } })
  );

  // Implement VS Code commands.
  // Where they show up is defined in package.json ("commands" and "menus").
  // They should all be listed under "activationEvents" in package.json, otherwise
  // calling them from the command palette would break if the extension is not loaded.

  context.subscriptions.push(commands.registerCommand('ldap-explorer.add-cacert', async () => {
    // Ask user to provide a location.
    const cacert = await pickNewCACert();

    // User did not provide a cert: cancel command.
    if (!cacert) {
      return;
    }

    // User provided a cert location: add it to the settings.
    CACertificateManager.addCACert(cacert);

    // Refresh view so the new cert shows up.
    cacertTreeDataProvider.refresh();
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.edit-cacert', async (existingCACert?: string) => {
    // No cert was provided, e.g. if the command fired from the command palette.
    // Ask user to pick an existing cert.
    if (!existingCACert) {
      existingCACert = await pickExistingCACert();
      if (!existingCACert) {
        // User did not pick any cert: do nothing.
        return;
      }
    }

    // Ask user for the new values.
    const newCACert = await pickNewCACert(existingCACert);
    if (!newCACert) {
      // User did not provide a new value: do nothing.
      return;
    }

    // Update cert in settings.
    CACertificateManager.editCACert(newCACert, existingCACert);

    // Refresh view so the cert does not show up anymore.
    cacertTreeDataProvider.refresh();
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.delete-cacert', async (cacert?: string) => {
    // No cert was provided, e.g. if the command fired from the command palette.
    // Ask user to pick an existing cert.
    if (!cacert) {
      cacert = await pickExistingCACert();
      if (!cacert) {
        // User did not pick any cert: do nothing.
        return;
      }
    }

    // Remove cert from the settings.
    CACertificateManager.removeCACert(cacert);

    // Refresh view so the cert does not show up anymore.
    cacertTreeDataProvider.refresh();
  }));

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

    // Reload connection details from settings.
    // Ensures the connection object includes bookmarks.
    connection = LdapConnectionManager.getConnection(connection.getName());

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

    return connection;
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
    cacertTreeDataProvider.refresh();
    connectionTreeDataProvider.refresh();
    entryTreeDataProvider.refresh();
    bookmarkTreeDataProvider.refresh();
  }));

  // Copy a string (e.g. a entry's DN or a certificate) to the system clipboard.
  // This command does not show in the command palette (it fires from the tree views)
  // so we are guaranteed to be provided with a non-null entry as an argument.
  context.subscriptions.push(commands.registerCommand('ldap-explorer.copy', (value: string) => {
    env.clipboard.writeText(value);
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.show-attributes', async (dn?: string) => {
    // If there is no active connection, then explicitly ask user to pick one.
    const connection = LdapConnectionManager.getActiveConnection(context) ?? await pickConnection();

    // User did not provide a connection: cancel command.
    if (!connection) {
      return;
    }

    // 'dn' may not be defined (e.g. if the command fired from the command palette instead of the tree view).
    // If that is the case we explictly ask the user to enter a DN.
    if (!dn) {
      dn = await pickDN();
      // User did not provide a DN: cancel command.
      if (!dn) {
        return;
      }
    }

    // Create webview with attributes of the DN.
    createShowAttributesWebview(connection, dn, context);
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.reveal-in-tree', async (dn?: string) => {
    // If there is no active connection, then ask user to pick one.
    if (!LdapConnectionManager.getActiveConnection(context)) {
      const connection = await commands.executeCommand("ldap-explorer.activate-connection");
      if (!connection) {
        // User did not provide a connection: cancel command.
        return;
      }
    }

    // 'dn' may not be defined (e.g. if the command fired from the command palette instead of the bookmarks view).
    // If that is the case we explictly ask the user to enter a DN.
    if (!dn) {
      dn = await pickDN();
      // User did not provide a DN: cancel command.
      if (!dn) {
        return;
      }
    }

    // Reveal DN in tree.
    // Requires EntryTreeDataProvider.getParent() to be implemented.
    entryTreeView.reveal(dn).then(
      value => {
        // Entry was found in tree, do nothing.
      },
      reason => {
        // Entry not found in tree, show error message.
        window.showErrorMessage(`Unable to reveal ${dn} in tree: ${reason}`);
      });
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.add-bookmark', async (dn?: string) => {
    // If there is no active connection, then explicitly ask user to pick one.
    const connection = LdapConnectionManager.getActiveConnection(context) ?? await pickConnection();

    // User did not provide a connection: cancel command.
    if (!connection) {
      return;
    }

    // 'dn' may not be defined (e.g. if the command fired from the command palette instead of the tree view).
    // If that is the case we explictly ask the user to enter a DN.
    if (!dn) {
      dn = await pickDN();
      // User did not provide a DN: cancel command.
      if (!dn) {
        return;
      }
    }

    // Add bookmark.
    connection.addBookmark(dn);

    // Persist bookmark in connection.
    LdapConnectionManager.editConnection(connection, connection.getName()).then(
      value => {
        // If the connection was successfully updated, then refresh the
        // bookmarks view so the new bookmark shows up.
        bookmarkTreeDataProvider.refresh();
      },
      reason => {
        // If connection could not be updated, then show error message.
        window.showErrorMessage(`Unable to update connection: ${reason}`);
      }
    );
  }));

  context.subscriptions.push(commands.registerCommand('ldap-explorer.delete-bookmark', async (dn?: string) => {
    // If there is no active connection, then explicitly ask user to pick one.
    const connection = LdapConnectionManager.getActiveConnection(context) ?? await pickConnection();

    // User did not provide a connection: cancel command.
    if (!connection) {
      return;
    }

    // 'dn' may not be defined (e.g. if the command fired from the command palette instead of the tree view).
    // If that is the case we explictly ask the user to enter a DN.
    if (!dn) {
      dn = await pickDN();
      // User did not provide a DN: cancel command.
      if (!dn) {
        return;
      }
    }

    // Remove bookmark.
    connection.deleteBookmark(dn);

    // Persist removal of the bookmark from the connection.
    LdapConnectionManager.editConnection(connection, connection.getName()).then(
      value => {
        // If the connection was successfully updated, then refresh the
        // bookmarks view so the bookmark goes away.
        bookmarkTreeDataProvider.refresh();
      },
      reason => {
        // If connection could not be updated, then show error message.
        window.showErrorMessage(`Unable to update connection: ${reason}`);
      }
    );
  }));

}

/**
 * Opens input box asking the user to enter a DN.
 */
async function pickDN(): Promise<string | undefined> {
  return await window.showInputBox({ placeHolder: "Enter a DN (e.g. cn=readers,ou=users,dc=example,dc=org)" });
}

/**
 * Opens box asking the user to enter a new CA certificate.
 */
async function pickNewCACert(defaultValue:string = ""): Promise<string | undefined> {
  return await window.showInputBox({
    placeHolder: "Location of the certificate (e.g. /path/to/rootCA.pem)",
    value: defaultValue
  });
}

/**
 * Opens quick pick box asking the user to select a CA certificate.
 */
async function pickExistingCACert(): Promise<string | undefined> {
  const options = CACertificateManager.getCACerts();
  return await window.showQuickPick(options, { placeHolder: "Select a certificate" });
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
