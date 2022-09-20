// Manages storage of connections in VS Code settings.

import * as vscode from 'vscode';
import { LdapConnection } from './ldapConnection';

export class LdapConnectionManager {

    // Get all connections from settings.
    static getConnections(): LdapConnection[] {
        return vscode.workspace.getConfiguration('ldap-explorer').get('connections', []).map(connection => new LdapConnection(
            connection["name"],
            connection["protocol"],
            connection["host"],
            connection["port"],
            connection["binddn"],
            connection["bindpwd"],
            connection["basedn"]
        ));
    }

    // Get connection by name.
    static getConnection(name: string): LdapConnection {
        const filteredConnections = this.getConnections().filter(connection => connection.name === name);
        if (filteredConnections.length < 1) {
            // @todo throw exception: no connection found.
        }
        if (filteredConnections.length > 1) {
            console.log(`Found ${filteredConnections.length} LDAP connections with name ${name}, expected at most 1.`);
        }
        return filteredConnections[0];
    }

    // Add new connection to settings.
    static addConnection(connection: LdapConnection) {
        // Get list of existing connections.
        let connections = this.getConnections();

        // Add the new connection.
        connections.push(connection);

        // Save new list of connections.
        // @todo if workspace is available then store in workspace settings (.vscode/settings.json), otherwise leave global settings (last parameter of the function - boolean)
        vscode.workspace.getConfiguration('ldap-explorer').update('connections', connections, true);
    }

    // Remove existing connection from settings.
    // @todo removal operation seems to remove the wrong connection
    static removeConnection(connection: LdapConnection) {
		// Ask for confirmation.
		vscode.window.showInformationMessage(`Are you sure you want to remove the connection '${connection.name}' ?`, { modal: true}, "Yes").then(confirm => {
			if (confirm) {

                // Get list of existing connections.
		        const connections = this.getConnections();

                // Get index of connection to delete.
		        const index = connections.findIndex(con => con.name === connection.name);
		        if (index < 0 ) {
			        vscode.window.showInformationMessage(`Unable to delete '${connection.name}': connection does not exist.`);
		        }

                // Remove connection from the list.
		        connections.splice(index, 1);

		        // Save new list of connections.
		        // @todo should catch errors in case we are unable to save settings
		        vscode.workspace.getConfiguration('ldap-explorer').update('connections', connections, true);

				// Refresh view so the connection does not show up anymore.
				// @todo refresh does not seem to work right: if I add a new connection then it does not automatically show up in the view use async/await, or make removeConnection Thenable
				vscode.commands.executeCommand("ldap-explorer.refresh-view");
			}
		});
    }

}
