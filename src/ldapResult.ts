import { LdapConnection } from './ldapConnection';
import { LdapNode } from './ldapNode';

export class LdapResult implements LdapNode {

    private dn: string;
    private connection: LdapConnection;

    constructor(dn: string, connection: LdapConnection) {
        this.dn = dn;
        this.connection = connection;
    }

    getLabel(): string {
        return this.dn;
    }
  
    getDescription(): string {
        return "";
    }

    getLdapConnection(): LdapConnection {
        return this.connection;
    }

    getDN(): string {
        return this.dn;
    }

    isExpandable(): boolean {
        // A "cn" designator is not supposed to have children.
        // Other designators ("ou", "dn") are containers and may have children.
        return !this.dn.startsWith("cn");
    }

    getCommand(): any {
        return {
            command: "ldap-browser.show-attributes",
            title: "Show Attributes",
            arguments: [this.dn] // @todo should likely pass this instead of this.dn (the command needs the whole connection object in order to connect to the ldap server)
        }
    }

}