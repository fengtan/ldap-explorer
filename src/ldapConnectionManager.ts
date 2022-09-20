// Manages storage of connections in VS Code settings.

import { commands, window, workspace } from 'vscode';
import { LdapConnection } from './ldapConnection';

// @todo use Thenable - there should be no call to vscode.window in this class.
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

    // Get connection by ID, or undefined if no connection was found.
    static getConnection(id: string): LdapConnection | undefined {
        const filteredConnections = this.getConnections().filter(connection => connection.getId() === id);
        if (filteredConnections.length < 1) {
            return;
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
        workspace.getConfiguration('ldap-explorer').update('connections', connections, true).then(
            value => {
                // If connection was successfully added, refresh tree view so it shows up.
                commands.executeCommand("ldap-explorer.refresh-view");
            },
            reason => {
                // If connection could not be added, show error message.
                window.showErrorMessage(`Unable to save new connection to settings: ${reason}`);
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
            window.showErrorMessage(`Unable to edit connection ${existingConnection.getId()}: connection does not exist in settings`);
            return;
        }

        // Replace existing connection with new connection.
        connections[index] = newConnection;

        // Save new list of connections.
        workspace.getConfiguration('ldap-explorer').update('connections', connections, true).then(
            value => {
                // If connection was successfully updated, refresh tree view.
                commands.executeCommand("ldap-explorer.refresh-view");
            },
            reason => {
                // If connection could not be updated, show error message.
                window.showErrorMessage(`Unable to update connection in settings: ${reason}`);
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
                        // If connection could not be removed, show error message.
                        window.showErrorMessage(`Unable to remove connection from settings: ${reason}`);
                    }
                );
			}
		});
    }

}
