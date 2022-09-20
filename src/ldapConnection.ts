import { createClient, SearchEntry, SearchOptions } from 'ldapjs';
import { window } from 'vscode';

export class LdapConnection {

    // Port and timeout are stored as strings instea of numbers because they may reference environment variables instead of actual numbers.
    private protocol: string;
    private host: string;
    private port: string;
    private binddn: string;
    private bindpwd: string;
    private basedn: string;
    private timeout: string;
  
    constructor(protocol: string, host: string, port: string, binddn: string, bindpwd: string, basedn: string, timeout: string) {
      this.protocol = protocol;
      this.host = host;
      this.port = port;
      this.binddn = binddn;
      this.bindpwd = bindpwd;
      this.basedn = basedn;
      this.timeout = timeout;
    }

    getProtocol(evaluate: boolean) {
      return this.get(this.protocol, evaluate);
    }
    getHost(evaluate: boolean) {
      return this.get(this.host, evaluate);
    }
    getPort(evaluate: boolean) {
      return this.get(this.port, evaluate);
    }
    getBindDn(evaluate: boolean) {
      return this.get(this.binddn, evaluate);
    }
    getBindPwd(evaluate: boolean) {
      return this.get(this.bindpwd, evaluate);
    }
    getBaseDn(evaluate: boolean) {
      return this.get(this.basedn, evaluate);
    }
    getTimeout(evaluate: boolean) {
      return this.get(this.timeout, evaluate);
    }

    get(value: string, evaluate: boolean) {
      return evaluate ? this.evaluate(value) : value;
    }

    // Connection ID ; used to identify its uniqueness.
    getId(): string {
      return `${this.getProtocol(false)}://${this.getBindDn(false)}@${this.getHost(false)}:${this.getPort(false)}/${this.getBaseDn(false)}`;
    }
  
    // Connection URL ; used to connect to the server.
    getUrl(): string {
      return `${this.getProtocol(true)}://${this.getHost(true)}:${this.getPort(true)}`;
    }

    // If value starts with "env:" (e.g. "env:myvar"), then return value of environment variable (e.g. value of "myvar").
    evaluate(value: string): string {
      if (!value.startsWith("env:")) {
        return value;
      }
      const varName = value.split(":")[1];
      return process.env[varName] ?? "";
    }

    // Searches LDAP.
    search(options: SearchOptions, base: string = this.getBaseDn(true)): Thenable<SearchEntry[]> {
      return new Promise((resolve, reject) => {

        // Create ldapjs client.
        const client = createClient({
          url: [this.getUrl()],
          timeout: Number(this.getTimeout(true))
        });

        // Bind.
        client.bind(this.getBindDn(true), this.getBindPwd(true), (err) => {
          if (err) {
            // @todo same comments as client.on below.
            console.log(err); // @todo drop ?
            window.showErrorMessage(`Error when binding: ${err}`); // @todo no, should throw exception and handle error in LdapDataProvider.ts, this class should only be about ldapjs, not about VS Code UI (and remove window from imports)
            client.unbind();
            client.destroy(); // @todo should destroy client at any other place where we handle an error
            // @todo return reject("unable to bind");
          }

          // Search.
          // @todo clean this messy search() call - should call reject() or resolve() etc instead of console.log
          client.search(base, options, (err, res) => {
            console.log(err); // @todo handle and return if there is an error

            let results: SearchEntry[] = [];
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
              // @todo verify status is 0 ? "You'll want to check the LDAP status code (likely for 0) on the end event to assert success"
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