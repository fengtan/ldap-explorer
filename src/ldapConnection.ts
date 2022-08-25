export class LdapConnection {

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
 
}