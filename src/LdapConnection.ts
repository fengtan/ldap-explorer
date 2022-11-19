import { readFileSync } from 'fs';
import { window } from 'vscode';
import { Client, createClient, SearchEntry, SearchOptions } from 'ldapjs';
import { LdapLogger } from './LdapLogger';
import { CACertificateManager } from './CACertificateManager';

/**
 * Represents an LDAP connection.
 */
export class LdapConnection {

  // Port, limit and timeout are stored as strings instead of numbers because
  // they may reference environment variables instead of actual numbers.
  // The same applies to starttls and verifycert which would normally be booleans.
  private name: string;
  private protocol: string;
  private starttls: string;
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
    starttls: string,
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
    this.starttls = starttls;
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
  public getStartTLS(evaluate: boolean) {
    return this.get(this.starttls, evaluate);
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

  // These variables are stored as strings instead of booleans to allow the user
  // to make use of environment variables.
  // We define additional functions that do return booleans.
  public getStartTLSBool(evaluate: boolean) {
    return (this.getStartTLS(evaluate).toLowerCase() === "true");
  }
  public getVerifyCertBool(evaluate: boolean) {
    return (this.getVerifyCert(evaluate).toLowerCase() === "true");
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
    CACertificateManager.getCACerts().forEach(cacertUri => {
      try {
        cacerts.push(readFileSync(cacertUri).toString());
      } catch (err) {
        window.showWarningMessage(`Unable to read CA certificate: ${cacertUri}`);
      }
    });

    // Return TLS options based on what the user configured.
    return {
      rejectUnauthorized: this.getVerifyCertBool(true),
      ca: cacerts.length > 0 ? cacerts : undefined,
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
  public search(
    searchOptions: SearchOptions,
    base: string = this.getBaseDn(true),
    onSearchEntryFound?: (entry: SearchEntry) => void
  ): Thenable<SearchEntry[]> {
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

      // Get results from server.
      // Initiate StartTLS beforehand if the connection is LDAP + StartTLS.
      if (this.getProtocol(true) === "ldap" && this.getStartTLSBool(true)) {
        // Empty controls (second argument) should be removed once this issue is
        // resolved: https://github.com/ldapjs/node-ldapjs/issues/326
        client.starttls(this.getTLSOptions(), [], (err, res) => {
          if (err) {
            return reject(`Unable to initiate StartTLS: ${err.message}`);
          }
          return this.getResults(client, resolve, reject, searchOptions, base, onSearchEntryFound);
        });
      }
      else {
        return this.getResults(client, resolve, reject, searchOptions, base, onSearchEntryFound);
      }
    });
  }

  /**
   * Get results from LDAP servers.
   */
  protected getResults(
    client: Client,
    resolve: (value: SearchEntry[] | PromiseLike<SearchEntry[]>) => void,
    reject: (reason?: any) => void,
    searchOptions: SearchOptions,
    base: string = this.getBaseDn(true),
    onSearchEntryFound ?: (entry: SearchEntry) => void
  ) {

    // Bind.
    client.bind(this.getBindDn(true), this.getBindPwd(true), (err) => {
      if (err) {
        return reject(`Unable to bind: ${err.message}`);
      }

      // Search.
      searchOptions.sizeLimit = parseInt(this.limit);
      try {
        client.search(base, searchOptions, (err, res) => {
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
  }

}
