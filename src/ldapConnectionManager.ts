// Manages storage of connections in VS Code settings.

import * as vscode from 'vscode';
import { LdapConnection } from './ldapConnection';

export class LdapConnectionManager {

    // Get all connections from settings.
    static getConnections(): LdapConnection[] {
        return vscode.workspace.getConfiguration('ldap-browser').get('connections', []).map(connection => new LdapConnection(
            connection["name"],
            connection["protocol"],
            connection["host"],
            connection["port"],
            connection["binddn"],
            connection["bindpwd"],
            connection["basedn"]
        ));
    }

    // Add new connection to settings.
    static addConnection(connection: LdapConnection) {
        // Get list of existing connections.
        let connections = this.getConnections();

        // Add the new connection.
        connections.push(connection);

        // Save new list of connections.
        // @todo if workspace is available then store in workspace settings (.vscode/settings.json), otherwise leave global settings (last parameter of the function - boolean)
        vscode.workspace.getConfiguration('ldap-browser').update('connections', connections, true);
    }

    // Remove existing connection from settings.
    // @todo removal operation seems to remove the wrong connection
    static removeConnection(name: string) {
        // Get list of existing connections.
		let connections = this.getConnections();

        // Get index of connection to delete.
		const index = connections.findIndex(connection => connection.name === name);
		if (index < 0 ) {
			vscode.window.showInformationMessage(`Unable to delete '${name}': connection does not exist.`);
		}

        // Remove connection from the list.
		connections.splice(index, 1);

		// Save new list of connections.
		// @todo should catch errors in case we are unable to save settings
		vscode.workspace.getConfiguration('ldap-browser').update('connections', connections, true);
    }

}