import { ExtensionContext, SecretStorage, window, workspace } from 'vscode';
import { LdapConnection } from './LdapConnection';
import { LdapLogger } from './LdapLogger';
import { PasswordMode } from './PasswordMode';

/**
 * Manages storage of connections in VS Code settings.
 */
export class LdapConnectionManager {

  private context: ExtensionContext;

  public constructor(context: ExtensionContext) {
    this.context = context;
  }

  /**
   * Get all connections stored in VS Code settings.
   */
  public getConnections(): LdapConnection[] {
    return workspace.getConfiguration('ldap-explorer').get('connections', []).map(connection => new LdapConnection({
      // Same default values as what is listed in package.json.
      // Providing default values brings backwards compatibility when adding more attributes.
      name: connection["name"],
      protocol: connection["protocol"] || "ldap",
      starttls: connection["starttls"] || "false",
      verifycert: connection["verifycert"] || "true",
      sni: connection["sni"] || "",
      host: connection["host"] || "",
      port: connection["port"] || "",
      binddn: connection["binddn"] || "",
      pwdmode: connection["pwdmode"] || "settings", // Default to settings if pwd mode is not set for backwards compatibility.
      bindpwd: connection["bindpwd"] || "",
      basedn: connection["basedn"] || "",
      limit: connection["limit"] || "0",
      paged: connection["paged"] || "true",
      connectTimeout: connection["connectTimeout"] || "5000",
      timeout: connection["timeout"] || "5000",
      bookmarks: connection["bookmarks"] || [],
    }));
  }

  /**
   * Get connection by name.
   *
   * Returns 'undefined' if no connection with such a name was found.
   */
  public getConnection(name: string): LdapConnection | undefined {
    const filteredConnections = this.getConnections().filter(connection => connection.getName() === name);
    if (filteredConnections.length < 1) {
      return undefined;
    }
    if (filteredConnections.length > 1) {
      LdapLogger.appendLine(`Found ${filteredConnections.length} LDAP connections with name '${name}', expected at most 1.`);
    }
    return filteredConnections[0];
  }

  /**
   * Set the active connection.
   */
  public setActiveConnection(connection: LdapConnection): Thenable<void> {
    return this.context.globalState.update('active-connection', connection.getName());
  }

  /**
   * Sets no active connection.
   */
  public setNoActiveConnection(): Thenable<void> {
    return this.context.globalState.update('active-connection', undefined);
  }

  /**
   * Get the currently active connection.
   */
  public getActiveConnection(): LdapConnection | undefined {
    const connectionName: string | undefined = this.context.globalState.get('active-connection');
    if (connectionName === undefined) {
      return undefined;
    }
    return this.getConnection(connectionName);
  }

  /**
   * Update a bind password in secret storage.
   *
   * If the connection's password mode is "secrets": updates secret storage.
   * Otherwise: clears password from secret storage.
   */
  public updateBindPwdInSecretStorage(connection: LdapConnection) {
    if (connection.getPwdMode(true) === PasswordMode.secretStorage) {
      // Return Thenable.
      // The SecretStorage API automatically takes care of namespacing so we don't need to worry about collistions with other extensions.
      return this.context.secrets.store(connection.getName(), connection.getBindPwd(false));
    } else {
      return this.deleteBindPwdFromSecretStorage(connection);
    }
  }

  /**
   * Remove a bind password from secret store.
   */
  public deleteBindPwdFromSecretStorage(connection: LdapConnection) {
    return this.context.secrets.delete(connection.getName());
  }

  /**
   * Add a new connection to settings.
   */
  public async addConnection(connection: LdapConnection): Promise<void> {
    // Get list of existing connections.
    let connections = this.getConnections();

    // Update or delete password  in secret storage.
    await this.updateBindPwdInSecretStorage(connection);

    // Add the new connection.
    // Temporarily remove bind password from connection object so it is not
    // persisted, if password mode is different from "settings".
    const bindpwd = connection.getBindPwd(false);
    if (connection.getPwdMode(true) !== PasswordMode.settings) {
      connection.setBindPwd(undefined);
    }
    connections.push(connection);

    // Save new list of connections and return Thenable.
    // Reinstate bind password is password mode is different from "settings".
    return workspace.getConfiguration('ldap-explorer').update('connections', connections, true).then(() => {
      if (connection.getPwdMode(true) !== PasswordMode.settings) {
        connection.setBindPwd(bindpwd);
      }
    });
  }

  /**
   * Update an existing connection in settings.
   */
  public async editConnection(newConnection: LdapConnection, existingConnectionName: string): Promise<void> {
    // Get list of existing connections.
    let connections = this.getConnections();

    // Get index of connection to edit.
    const index = connections.findIndex(con => con.getName() === existingConnectionName);
    if (index < 0) {
      return Promise.reject(`Connection '${existingConnectionName}' does not exist in settings`);
    }

    // Update or delete password  in secret storage.
    await this.updateBindPwdInSecretStorage(newConnection);

    // Replace existing connection with new connection.
    // Temporarily remove bind password from connection object so it is not
    // persisted, if password mode is different from "settings".
    const bindpwd = newConnection.getBindPwd(false);
    if (newConnection.getPwdMode(true) !== PasswordMode.settings) {
      newConnection.setBindPwd(undefined);
    }
    connections[index] = newConnection;

    // Save new list of connections and return Thenable.
    // Reinstate bind password is password mode is different from "settings".
    return workspace.getConfiguration('ldap-explorer').update('connections', connections, true).then(() => {
      if (newConnection.getPwdMode(true) !== PasswordMode.settings) {
        newConnection.setBindPwd(bindpwd);
      }
    });
  }

  /**
   * Remove an existing connection from settings.
   *
   * Also removes the password from secret storage.
   */
  public async removeConnection(connection: LdapConnection): Promise<void> {
    // Get list of existing connections.
    const connections = this.getConnections();

    // Get index of connection to delete.
    const index = connections.findIndex(con => con.getName() === connection.getName());
    if (index < 0) {
      return Promise.reject(`Connection '${connection.getName()}' does not exist in settings`);
    }

    // Remove connection from the list.
    connections.splice(index, 1);

    // Remove password from secret store (regardless of current password mode).
    await this.deleteBindPwdFromSecretStorage(connection);

    // Save new list of connections and return Thenable.
    return workspace.getConfiguration('ldap-explorer').update('connections', connections, true);
  }

}
