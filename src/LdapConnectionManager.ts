import { ExtensionContext, workspace } from 'vscode';
import { LdapConnection } from './LdapConnection';
import { LdapLogger } from './LdapLogger';

/**
 * Manages storage of connections in VS Code settings.
 */
export class LdapConnectionManager {

  /**
   * Get all connections stored in VS Code settings.
   */
  public static getConnections(): LdapConnection[] {
    return workspace.getConfiguration('ldap-explorer').get('connections', []).map(connection => new LdapConnection(
      // Same default values as what is listed in package.json.
      // Providing default values brings backwards compatibility when adding more attributes.
      connection["name"],
      connection["protocol"] || "ldap",
      connection["starttls"] || "false",
      connection["verifycert"] || "true",
      connection["sni"] || "",
      connection["host"] || "",
      connection["port"] || "",
      connection["binddn"] || "",
      connection["bindpwd"] || "",
      connection["basedn"] || "",
      connection["limit"] || "0",
      connection["paged"] || "true",
      connection["connectTimeout"] || "5000",
      connection["timeout"] || "5000",
      connection["bookmarks"] || []
    ));
  }

  /**
   * Get connection by name.
   *
   * Returns 'undefined' if no connection with such a name was found.
   */
  public static getConnection(name: string): LdapConnection | undefined {
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
  public static setActiveConnection(context: ExtensionContext, connection: LdapConnection): Thenable<void> {
    return context.globalState.update('active-connection', connection.getName());
  }

  /**
   * Sets no active connection.
   */
  public static setNoActiveConnection(context: ExtensionContext): Thenable<void> {
    return context.globalState.update('active-connection', undefined);
  }

  /**
   * Get the currently active connection.
   */
  public static getActiveConnection(context: ExtensionContext): LdapConnection | undefined {
    const connectionName: string | undefined = context.globalState.get('active-connection');
    if (connectionName === undefined) {
      return undefined;
    }
    return this.getConnection(connectionName);
  }

  /**
   * Add a new connection to settings.
   */
  public static addConnection(connection: LdapConnection): Thenable<void> {
    // Get list of existing connections.
    let connections = this.getConnections();

    // Add the new connection.
    connections.push(connection);

    // Save new list of connections and return Thenable.
    return workspace.getConfiguration('ldap-explorer').update('connections', connections, true);
  }

  /**
   * Update an existing connection in settings.
   */
  public static editConnection(newConnection: LdapConnection, existingConnectionName: string): Thenable<void> {
    // Get list of existing connections.
    let connections = this.getConnections();

    // Get index of connection to edit.
    const index = connections.findIndex(con => con.getName() === existingConnectionName);
    if (index < 0) {
      return Promise.reject(`Connection '${existingConnectionName}' does not exist in settings`);
    }

    // Replace existing connection with new connection.
    connections[index] = newConnection;

    // Save new list of connections and return Thenable.
    return workspace.getConfiguration('ldap-explorer').update('connections', connections, true);
  }

  /**
   * Remove an existing connection from settings.
   */
  public static removeConnection(connection: LdapConnection): Thenable<void> {
    // Get list of existing connections.
    const connections = this.getConnections();

    // Get index of connection to delete.
    const index = connections.findIndex(con => con.getName() === connection.getName());
    if (index < 0) {
      return Promise.reject(`Connection '${connection.getName()}' does not exist in settings`);
    }

    // Remove connection from the list.
    connections.splice(index, 1);

    // Save new list of connections and return Thenable.
    return workspace.getConfiguration('ldap-explorer').update('connections', connections, true);
  }

}
