import { LdapNode } from './ldapNode';

export class LdapConnection implements LdapNode {

    public name: string;
    public protocol: string;
    public host: string;
    public port: number;
    public binddn: string;
    public bindpwd: string;
    public basedn: string;
  
    constructor(name: string, protocol: string, host: string, port: number, binddn: string, bindpwd: string, basedn: string) {
      this.name = name;
      this.protocol = protocol;
      this.host = host;
      this.port = port;
      this.binddn = binddn;
      this.bindpwd = bindpwd;
      this.basedn = basedn;
    }
  
    getUrl(): string {
      return this.protocol + "://" + this.host + ":" + this.port;
    }

    getLabel(): string {
      return this.name;
    }

    getDescription(): string {
      return this.getUrl() + " (" + this.basedn + ")";
    }

    getLdapConnection(): LdapConnection {
      return this;
    }

    getDN(): string {
      return this.basedn;
    }

    isExpandable(): boolean {
      // Always expandable: expanding the connection in the tree view means getting the root of this connection's results hierarchy.
      return true;
    }

    getCommand(): any {
      return {}; // @todo this is problematic: when clicking on the connection in tree view, an error shows up in console.log
    }
  
}