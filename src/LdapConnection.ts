import { Client, createClient, SearchEntry, SearchOptions } from 'ldapjs';
import { LdapLogger } from './LdapLogger';

export class LdapConnection {

  // Port and timeout are stored as strings instea of numbers because they may reference environment variables instead of actual numbers.
  private name: string;
  private protocol: string;
  private host: string;
  private port: string;
  private binddn: string;
  private bindpwd: string;
  private basedn: string;
  private timeout: string;

  constructor(name: string, protocol: string, host: string, port: string, binddn: string, bindpwd: string, basedn: string, timeout: string) {
    this.name = name;
    this.protocol = protocol;
    this.host = host;
    this.port = port;
    this.binddn = binddn;
    this.bindpwd = bindpwd;
    this.basedn = basedn;
    this.timeout = timeout;
  }

  getName() {
    return this.name;
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

  // Connection URL ; used to connect to the server.
  getUrl(): string {
    return `${this.getProtocol(true)}://${this.getHost(true)}:${this.getPort(true)}`;
  }

  setName(name: string) {
    this.name = name;
  }

  // If value is "${something}", then return value of environment variable (e.g. value of environment variable "something") ; if no such environment variable exists then return an empty string.
  // Otherwise return the value itself.
  evaluate(value: string): string {
    // https://regex101.com/r/TmWPxy/1
    const regex = /^\${(.+)}$/;
    const matches = regex.exec(value);
    if (!matches) {
      return value;
    }
    const varName = matches[1];
    return process.env[varName] ?? "";
  }

  /**
   * Searches LDAP.
   */
  search(options: SearchOptions, base: string = this.getBaseDn(true)): Thenable<SearchEntry[]> {
    return new Promise((resolve, reject) => {

      // Get ldapjs client.
      const client: Client = createClient({
        url: [this.getUrl()],
        timeout: Number(this.getTimeout(true))
      });

      // Pass errors to client class.
      client.on('error', (err) => {
        return reject(`Connection error: ${err.message}`);
      });

      // Bind.
      client.bind(this.getBindDn(true), this.getBindPwd(true), (err, res) => {
        if (err) {
          return reject(`Unable to bind: ${err.message}`);
        }

        // Search.
        client.search(base, options, (err, res) => {
          if (err) {
            return reject(`Unable to search: ${err.message}`);
          }

          let results: SearchEntry[] = [];
          res.on('searchRequest', (searchRequest) => {
            LdapLogger.getOutputChannel().appendLine(`Search request: ${JSON.stringify(searchRequest)}`);
          });
          res.on('searchEntry', (entry) => {
            results.push(entry);
            LdapLogger.getOutputChannel().appendLine(`Search entry: ${entry.dn}`);
          });
          res.on('searchReference', (referral) => {
            // @todo support referrals ?
            LdapLogger.getOutputChannel().appendLine(`Search referral: ${referral.uris.join()}`);
          });
          res.on('error', (err) => {
            return reject(`Unable to search: ${err.message}`);
          });
          res.on('end', (result) => {
            client.unbind((err) => {
              return reject(`Unable to unbind: ${err.message}`);
            });
            if (result?.status !== 0) {
              return reject(`Server returned status code ${result?.status}: ${result?.errorMessage}`);
            }
            return resolve(results);
          });

        });
      });

    });
  }

}
