import * as ldapjs from 'ldapjs'; // @todo may not need to import *
import * as vscode from 'vscode';

export class LdapConnection {

    private protocol: string;
    private host: string;
    private port: number;
    private binddn: string;
    private bindpwd: string;
    private basedn: string;
    private timeout: number;
  
    constructor(protocol: string, host: string, port: number, binddn: string, bindpwd: string, basedn: string, timeout: number) {
      this.protocol = protocol;
      this.host = host;
      this.port = port;
      this.binddn = binddn;
      this.bindpwd = bindpwd;
      this.basedn = basedn;
      this.timeout = timeout;
    }

    getProtocol() {
      return this.protocol;
    }
    getHost() {
      return this.host;
    }
    getPort() {
      return this.port;
    }
    getBindDn() {
      return this.binddn;
    }
    getBindPwd() {
      return this.bindpwd;
    }
    getBaseDn() {
      return this.basedn;
    }
    getTimeout() {
      return this.timeout;
    }

    getId(): string {
      return `${this.protocol}://${this.binddn}@${this.host}:${this.port}/${this.basedn}`;
    }
  
    getUrl(): string {
      return `${this.protocol}://${this.host}:${this.port}`;
    }

    // Searches LDAP.
    search(options: ldapjs.SearchOptions, base: string = this.basedn): Thenable<ldapjs.SearchEntry[]> {
      return new Promise((resolve, reject) => {
        // Create ldapjs client.
        const client = ldapjs.createClient({
          url: [this.getUrl()],
          timeout: this.timeout
        });

        // Bind.
        client.bind(this.binddn, this.bindpwd, (err) => {
          if (err) {
            // @todo same comments as client.on below.
            console.log(err); // @todo drop ?
            vscode.window.showErrorMessage(`Error when binding: ${err}`); // @todo no, should throw exception and handle error in LdapDataProvider.ts, this class should only be about ldapjs, not about VS Code UI
            client.unbind();
            client.destroy(); // @todo should destroy client at any other place where we handle an error
            // @todo return reject("unable to bind");
          }

          // Search.
          // @todo clean this messy search() call - should call reject() or resolve() etc instead of console.log
          client.search(base, options, (err, res) => {
            console.log(err); // @todo handle and return if there is an error

            let results: ldapjs.SearchEntry[] = [];
            res.on('searchRequest', (searchRequest) => {
              console.log(`searchRequest: ${searchRequest.messageID}`);
            });
            res.on('searchEntry', (entry) => {
              results.push(entry);
              console.log(`entry: ${JSON.stringify(entry.object)}`);
            });
            res.on('searchReference', (referral) => {
              console.log(`referral: ${referral.uris.join()}`);
            });
            res.on('error', (err) => {
              console.error(`error: ${err.message}`); // @todo call reject()
            });
            res.on('end', (result) => {
              // @todo verify status is 0 ?
              console.log(`status: ${result!.status}`);
              client.unbind();
              client.destroy();
              return resolve(results);
            });

          });
        });


        

        /*
        @todo uncomment ?
        client.on('error', (err) => {
          // @todo wording (find something better than just "Error: XX")
          // @todo handle different types of error ? http://ldapjs.org/errors.html
          // @todo test (when host is invalid, when bind dn does not work, when password does not work, etc)
          console.log(err);
          vscode.window.showErrorMessage(`Error (regular): ${err}`);
          return Promise.resolve([]);
        });
        */
      });
    }
 
}