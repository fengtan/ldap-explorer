// Manages storage of connections in VS Code settings.

import { ExtensionContext, workspace } from 'vscode';
import { LdapConnection } from './LdapConnection';
import { LdapLogger } from './LdapLogger';

export class LdapConnectionManager {

  // Get all connections from settings.
  static getConnections(): LdapConnection[] {
    return workspace.getConfiguration('ldap-explorer').get('connections', []).map(connection => new LdapConnection(
      connection["name"],
      connection["protocol"],
      connection["host"],
      connection["port"],
      connection["binddn"],
      connection["bindpwd"],
      connection["basedn"],
      connection["limit"],
      connection["timeout"]
    ));
  }

  // Get connection by name, or undefined if no connection was found.
  static getConnection(name: string): LdapConnection | undefined {
    const filteredConnections = this.getConnections().filter(connection => connection.getName() === name);
    if (filteredConnections.length < 1) {
      return undefined;
    }
    if (filteredConnections.length > 1) {
      LdapLogger.getOutputChannel().appendLine(`Found ${filteredConnections.length} LDAP connections with name '${name}', expected at most 1.`);
    }
    return filteredConnections[0];
  }

  static setActiveConnection(context: ExtensionContext, connection: LdapConnection): Thenable<void> {
    return context.globalState.update('active-connection', connection.getName());
  }

  static setNoActiveConnection(context: ExtensionContext): Thenable<void> {
    return context.globalState.update('active-connection', undefined);
  }

  static getActiveConnection(context: ExtensionContext): LdapConnection | undefined {
    const connectionName: string | undefined = context.globalState.get('active-connection');
    if (connectionName === undefined) {
      return undefined;
    }
    return this.getConnection(connectionName);
  }

  // Add new connection to settings.
  static addConnection(connection: LdapConnection): Thenable<void> {
    // Get list of existing connections.
    let connections = this.getConnections();

    // Add the new connection.
    connections.push(connection);

    // Save new list of connections and return Thenable.
    return workspace.getConfiguration('ldap-explorer').update('connections', connections, true);
  }

  // Edit existing connection in settings.
  static editConnection(newConnection: LdapConnection, existingConnection: LdapConnection): Thenable<void> {
    // Get list of existing connections.
    let connections = this.getConnections();

    // Get index of connection to edit.
    const index = connections.findIndex(con => con.getName() === existingConnection.getName());
    if (index < 0) {
      return Promise.reject(`Connection '${existingConnection.getName()}' does not exist in settings`);
    }

    // Replace existing connection with new connection.
    connections[index] = newConnection;

    // Save new list of connections and return Thenable.
    return workspace.getConfiguration('ldap-explorer').update('connections', connections, true);
  }

  // Remove existing connection from settings.
  static removeConnection(connection: LdapConnection): Thenable<void> {
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
