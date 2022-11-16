// @todo wildcard import
import * as fs from 'fs';
import { workspace } from 'vscode';
import { Client, createClient, SearchEntry, SearchOptions } from 'ldapjs';
import { LdapLogger } from './LdapLogger';

/**
 * Represents an LDAP connection.
 */
export class LdapConnection {

  // Port, limit and timeout are stored as strings instead of numbers because
  // they may reference environment variables instead of actual numbers.
  // The same applies to "Verify SSL" which would normally be a boolean.
  private name: string;
  private protocol: string;
  private verifyssl: string;
  private host: string;
  private port: string;
  private binddn: string;
  private bindpwd: string;
  private basedn: string;
  private limit: string;
  private timeout: string;
  private bookmarks: string[];

  constructor(name: string, protocol: string, verifyssl: string, host: string, port: string, binddn: string, bindpwd: string, basedn: string, limit: string, timeout: string, bookmarks: string[]) {
    this.name = name;
    this.protocol = protocol;
    this.verifyssl = verifyssl;
    this.host = host;
    this.port = port;
    this.binddn = binddn;
    this.bindpwd = bindpwd;
    this.basedn = basedn;
    this.limit = limit;
    this.timeout = timeout;
    this.bookmarks = bookmarks;
  }

  // Getters.
  public getName() {
    return this.name;
  }
  public getProtocol(evaluate: boolean) {
    return this.get(this.protocol, evaluate);
  }
  public getVerifySSL(evaluate: boolean) {
    return this.get(this.verifyssl, evaluate);
  }
  public getHost(evaluate: boolean) {
    return this.get(this.host, evaluate);
  }
  public getPort(evaluate: boolean) {
    return this.get(this.port, evaluate);
  }
  public getBindDn(evaluate: boolean) {
    return this.get(this.binddn, evaluate);
  }
  public getBindPwd(evaluate: boolean) {
    return this.get(this.bindpwd, evaluate);
  }
  public getBaseDn(evaluate: boolean) {
    return this.get(this.basedn, evaluate);
  }
  public getLimit(evaluate: boolean) {
    return this.get(this.limit, evaluate);
  }
  public getTimeout(evaluate: boolean) {
    return this.get(this.timeout, evaluate);
  }
  public getBookmarks() {
    return this.bookmarks;
  }

  /**
   * Get a value and evaluates it as an environment variable if necessary.
   */
  public get(value: string, evaluate: boolean) {
    return evaluate ? this.evaluate(value) : value;
  }

  /**
   * Connection string.
   */
  public getUrl(): string {
    return `${this.getProtocol(true)}://${this.getHost(true)}:${this.getPort(true)}`;
  }

  /**
   * Sets the name of the connection.
   */
  public setName(name: string) {
    this.name = name;
  }

  /**
   * Adds a bookmark.
   */
  public addBookmark(dn: string) {
    this.bookmarks.push(dn);
  }

  /**
   * Removes a bookmark.
   */
  public deleteBookmark(dn: string) {
    // Get index of bookmark to delete.
    const index = this.bookmarks.findIndex(bookmark => bookmark === dn);
    if (index < 0) {
      // dn not found in existing bookmarks, nothing to remove.
      return;
    }

    // Remove dn from the bookmarks.
    this.bookmarks.splice(index, 1);
  }

  /**
   * Evaluates a value.
   *
   * If value starts with a dollar sign and is wrapped to curly braces (e.g. "${something}")
   * then return the value of the environment variable (e.g. value of environment variable "something").
   * If no such environment variable exists then return an empty string.
   *
   * Otherwise return the value itself.
   */
  public evaluate(value: string): string {
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
   * Searches the LDAP connection and calls a callback when a result is found or
   * if the search failed.
   *
   * 2 ways to get the list of results:
   * - Pass a callback onSearchEntryFound (will fire for *each* result as they are received)
   * - Resolve callback - this function is Thenable (will fire when *all* results have been received)
   */
  public search(options: SearchOptions, base: string = this.getBaseDn(true), onSearchEntryFound?: (entry: SearchEntry) => void): Thenable<SearchEntry[]> {
    return new Promise((resolve, reject) => {
      // Prepare TLS options if we are connecting with LDAPS.
      // @todo also set TLS options if starttls
      // @todo document in README.md (Usage section) + CONTRIBUTING.md how to set certificates + skip cert verification
      // @todo explain in README.md /workspaces/ldap-explorer/.devcontainer/certs/openldap.crt is already listed as trusted
      // @todo in README.md "if the certificate of the server you're connecting to is not signed by a CA your system trusts (e.g. self-signed cert), then you may want to provide a CA cert here" ; somehow need to set openldap.crt instead of rootCA.pem
      // @todo confirm verifyssl works with environment variables
      // See https://nodejs.org/api/tls.html
      let tlsOptions = {};
      if (this.getProtocol(true) === "ldaps") {
        // @todo complain if cacertFile does not exist, is not readable, etc
        const cacerts: string[] = workspace.getConfiguration('ldap-explorer').get('cacerts', []).map(cacertFile => fs.readFileSync(cacertFile).toString());
        tlsOptions = {
          rejectUnauthorized: (this.getVerifySSL(true).toLowerCase() !== 'true'), // @todo make sure this works if user set boolean (not string) in settings.json
          ca: cacerts,
          servername: "example.org" // @todo turn into optional field ; explain: must match CN field of the certificate (distinguised name ?)
        };
      }

      // Get ldapjs client.
      const client: Client = createClient({
        url: [this.getUrl()],
        timeout: Number(this.getTimeout(true)),
        tlsOptions: tlsOptions,
      });

      // Pass errors to client class.
      client.on('error', (err) => {
        return reject(`Connection error: ${err.message}`);
      });

      // Bind.
      client.bind(this.getBindDn(true), this.getBindPwd(true), (err) => {
        if (err) {
          return reject(`Unable to bind: ${err.message}`);
        }

        // Search.
        options.sizeLimit = parseInt(this.limit);
        try {
          client.search(base, options, (err, res) => {
            if (err) {
              return reject(err.message);
            }

            let results: SearchEntry[] = [];
            res.on('searchRequest', (searchRequest) => {
              LdapLogger.appendLine(`Search request: ${JSON.stringify(searchRequest)}`);
            });
            res.on('searchEntry', (entry) => {
              // Fire onSearchEntryFound callback (if one was provided).
              if (onSearchEntryFound) {
                onSearchEntryFound(entry);
              }
              // Add each result to our array, which will be returned by the
              // resolve callback.
              results.push(entry);
            });
            res.on('searchReference', (referral) => {
              LdapLogger.appendLine(`Search referral: ${referral.uris.join()}`);
            });
            res.on('error', (err) => {
              return reject(err.message);
            });
            res.on('end', (result) => {
              // Unbind.
              client.unbind();
              // Verify status code returned by the server.
              if (result?.status !== 0) {
                return reject(`Server returned status code ${result?.status}: ${result?.errorMessage}`);
              }
              // Return results.
              return resolve(results);
            });

          });
        } catch (cause) {
          // This would happen if the user entered an invalid LDAP filter for instance.
          // See https://github.com/ldapjs/node-ldapjs/issues/618
          return reject(cause);
        }
      });

    });
  }

}
