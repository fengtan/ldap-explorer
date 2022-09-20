// Manages storage of connections in VS Code settings.

import { commands, window, workspace } from 'vscode';
import { LdapConnection } from './ldapConnection';

export class LdapConnectionManager {

    // Get all connections from settings.
    static getConnections(): LdapConnection[] {
        return workspace.getConfiguration('ldap-explorer').get('connections', []).map(connection => new LdapConnection(
            connection["protocol"],
            connection["host"],
            connection["port"],
            connection["binddn"],
            connection["bindpwd"],
            connection["basedn"],
            connection["timeout"]
        ));
    }

    // Get connection by ID.
    static getConnection(id: string): LdapConnection {
        const filteredConnections = this.getConnections().filter(connection => connection.getId() === id);
        if (filteredConnections.length < 1) {
            // @todo throw exception: no connection found.
        }
        if (filteredConnections.length > 1) {
            console.log(`Found ${filteredConnections.length} LDAP connections with ID ${id}, expected at most 1.`);
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
        workspace.getConfiguration('ldap-explorer').update('connections', connections, true).then(
            value => {
                // If connection was successfully added, refresh tree view so it shows up.
                commands.executeCommand("ldap-explorer.refresh-view");
            },
            reason => {
		        // @todo should catch errors and show Error message if we are unable to save settings
            }
        );
    }

    // Edit existing connection in settings.
    static editConnection(newConnection: LdapConnection, existingConnection: LdapConnection) {
        // Get list of existing connections.
        let connections = this.getConnections();

        // Get index of connection to edit.
        const index = connections.findIndex(con => con.getId() === existingConnection.getId());
        if (index < 0 ) {
            window.showErrorMessage(`Unable to edit '${existingConnection.getId()}': connection does not exist.`);
            return;
        }

        // Replace existing connection with new connection.
        connections[index] = newConnection;

        // Save new list of connections.
        // @todo if workspace is available then store in workspace settings (.vscode/settings.json), otherwise leave global settings (last parameter of the function - boolean)
        workspace.getConfiguration('ldap-explorer').update('connections', connections, true).then(
            value => {
                // If connection was successfully updated, refresh tree view.
                commands.executeCommand("ldap-explorer.refresh-view");
            },
            reason => {
		        // @todo should catch errors and show Error message if we are unable to save settings
            }
        );
    }

    // Remove existing connection from settings.
    static removeConnection(connection: LdapConnection) {
		// Ask for confirmation.
		window.showInformationMessage(`Are you sure you want to remove the connection ${connection.getBaseDn(true)} (${connection.getUrl()}) ?`, { modal: true}, "Yes").then(confirm => {
			if (confirm) {

                // Get list of existing connections.
		        const connections = this.getConnections();

                // Get index of connection to delete.
		        const index = connections.findIndex(con => con.getId() === connection.getId());
		        if (index < 0 ) {
			        window.showInformationMessage(`Unable to delete '${connection.getId()}': connection does not exist.`);
                    return;
		        }

                // Remove connection from the list.
		        connections.splice(index, 1);

		        // Save new list of connections.
		        workspace.getConfiguration('ldap-explorer').update('connections', connections, true).then(
                    value => {
                        // If connection was successfully removed, refresh tree view so it does not show up anymore.
                        commands.executeCommand("ldap-explorer.refresh-view");
                    }, reason => {
		                // @todo should catch errors and show Error message if we are unable to save settings
                    }
                );
			}
		});
    }

}
