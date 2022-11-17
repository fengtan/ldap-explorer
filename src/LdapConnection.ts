// @todo wildcard import
import * as fs from 'fs';
import { window, workspace } from 'vscode';
import { Client, createClient, SearchEntry, SearchOptions } from 'ldapjs';
import { LdapLogger } from './LdapLogger';

/**
 * Represents an LDAP connection.
 */
export class LdapConnection {

  // Port, limit and timeout are stored as strings instead of numbers because
  // they may reference environment variables instead of actual numbers.
  // The same applies to 'verifycert' which would normally be a boolean.
  private name: string;
  private protocol: string;
  private verifycert: string;
  private sni: string;
  private host: string;
  private port: string;
  private binddn: string;
  private bindpwd: string;
  private basedn: string;
  private limit: string;
  private timeout: string;
  private bookmarks: string[];

  constructor(
    name: string,
    protocol: string,
    verifycert: string,
    sni: string,
    host: string,
    port: string,
    binddn: string,
    bindpwd: string,
    basedn: string,
    limit: string,
    timeout: string,
    bookmarks: string[]
  ) {
    this.name = name;
    this.protocol = protocol;
    this.verifycert = verifycert;
    this.sni = sni;
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
  public getVerifyCert(evaluate: boolean) {
    return this.get(this.verifycert, evaluate);
  }
  public getSni(evaluate: boolean) {
    return this.get(this.sni, evaluate);
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
   * Get TLS options for establishing secure connections.
   *
   * @see https://nodejs.org/api/tls.html
   *
   * @returns
   *   TLS options
   */
  protected getTLSOptions() {
    // Read contents of CA cert files defined by the user, if any.
    const cacerts: string[] = [];
    workspace.getConfiguration('ldap-explorer').get('cacerts', []).forEach(cacertUri => {
      try {
        cacerts.push(fs.readFileSync(cacertUri).toString());
      } catch (err) {
        window.showWarningMessage(`Unable to read CA certificate configured in settings: ${cacertUri}`);
      }
    });

    // Return TLS options based on what the user configured.
    return {
      rejectUnauthorized: (this.getVerifyCert(true).toLowerCase() === 'true'),
      ca: cacerts,
      servername: (this.getSni(false) ? this.getSni(true) : undefined),
    };
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
      // Get ldapjs client.
      const client: Client = createClient({
        url: [this.getUrl()],
        timeout: Number(this.getTimeout(true)),
        tlsOptions: (this.getProtocol(true) === "ldaps" ? this.getTLSOptions() : {}),
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
