import { readFileSync } from 'fs';
import { ExtensionContext, window, workspace } from 'vscode';
import { Attribute, Client, createClient, SearchEntry, SearchOptions } from 'ldapjs';
import { LdapLogger } from './LdapLogger';
import { CACertificateManager } from './CACertificateManager';
import { PasswordMode } from './PasswordMode';

/**
 * Represents an LDAP connection.
 */
export class LdapConnection {

  // Port, limit and timeouts are stored as strings instead of numbers because
  // they may reference environment variables instead of actual numbers.
  // The same applies to starttls, verifycert and paged which would normally be
  // booleans.
  private name: string;
  private protocol: string;
  private starttls: string;
  private verifycert: string;
  private sni: string;
  private host: string;
  private port: string;
  private binddn: string;
  private pwdmode: string;
  private bindpwd: string | undefined;
  private basedn: string;
  private limit: string;
  private paged: string;
  private connectTimeout: string;
  private timeout: string;
  private bookmarks: string[];

  constructor({
    name,
    protocol,
    starttls,
    verifycert,
    sni,
    host,
    port,
    binddn,
    pwdmode,
    bindpwd,
    basedn,
    limit,
    paged,
    connectTimeout,
    timeout,
    bookmarks,
  }: {
    name: string,
    protocol: string,
    starttls: string,
    verifycert: string,
    sni: string,
    host: string,
    port: string,
    binddn: string,
    pwdmode: string,
    bindpwd: string,
    basedn: string,
    limit: string,
    paged: string,
    connectTimeout: string,
    timeout: string,
    bookmarks: string[],
  }) {
    this.name = name;
    this.protocol = protocol;
    this.starttls = starttls;
    this.verifycert = verifycert;
    this.sni = sni;
    this.host = host;
    this.port = port;
    this.binddn = binddn;
    this.pwdmode = pwdmode;
    this.bindpwd = bindpwd;
    this.basedn = basedn;
    this.limit = limit;
    this.paged = paged;
    this.connectTimeout = connectTimeout;
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
    // If bindpwd is undefined then return empty string.
    if (!this.bindpwd) {
      return "";
    }
    // Otherwise return the value and evaluate it, if necessary.
    return this.get(this.bindpwd, evaluate);
  }
  public getPwdMode(evaluate: boolean) {
    return this.get(this.pwdmode, evaluate);
  }
  public getBaseDn(evaluate: boolean) {
    return this.get(this.basedn, evaluate);
  }
  public getLimit(evaluate: boolean) {
    return this.get(this.limit, evaluate);
  }
  public getPaged(evaluate: boolean) {
    return this.get(this.paged, evaluate);
  }
  public getConnectTimeout(evaluate: boolean) {
    return this.get(this.connectTimeout, evaluate);
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
  public getPagedBool(evaluate: boolean) {
    return (this.getPaged(evaluate).toLowerCase() === "true");
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
   * Set the bind password of the connection.
   */
  public setBindPwd(bindpwd: string | undefined) {
    this.bindpwd = bindpwd;
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
  public search({
    context,
    searchOptions,
    pwdmode,
    base,
    onSearchEntryFound,
  }: {
    context: ExtensionContext,
    searchOptions: SearchOptions,
    pwdmode?: string,
    base?: string,
    onSearchEntryFound?: (entry: SearchEntry) => void,
  }): Thenable<SearchEntry[]> {
    return new Promise((resolve, reject) => {
      // Get ldapjs client.
      const client: Client = createClient({
        url: [this.getUrl()],
        connectTimeout: Number(this.getConnectTimeout(true)),
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
          return this.getResults({
            context: context,
            client: client,
            resolve: resolve,
            reject: reject,
            searchOptions: searchOptions,
            pwdmode: pwdmode,
            base: base,
            onSearchEntryFound: onSearchEntryFound,
          });
        });
      }
      else {
        return this.getResults({
          context: context,
          client: client,
          resolve: resolve,
          reject: reject,
          searchOptions: searchOptions,
          pwdmode: pwdmode,
          base: base,
          onSearchEntryFound: onSearchEntryFound,
        });
      }
    });
  }

  /**
 * Opens input box asking the user to enter a bind password.
   */
  protected async pickBindPassword(): Promise<string | undefined> {
    return await window.showInputBox({ prompt: `Bind password for connection "${this.getName()}"` });
  }

  /**
   * Get results from LDAP servers.
   */
  protected async getResults({
    context,
    client,
    resolve,
    reject,
    searchOptions,
    pwdmode,
    base,
    onSearchEntryFound,
  }: {
    context: ExtensionContext,
    client: Client,
    resolve: (value: SearchEntry[] | PromiseLike<SearchEntry[]>) => void,
    reject: (reason?: any) => void,
    searchOptions: SearchOptions,
    // Override password mode configured for this connection.
    // Essentially used when testing the connection (in which case the bind password may not yet be persisted in settings or secret store).
    pwdmode?: string,
    // Override base DN.
    // Essentially used to search for immeditate children in tree view.
    base?: string,
    onSearchEntryFound ?: (entry: SearchEntry) => void
  }) {
    // Get bind password depending on password mode.
    let bindpwd: string | undefined;
    switch (pwdmode ?? this.getPwdMode(true)) {
    case PasswordMode.ask:
      bindpwd = await this.pickBindPassword();
      if (!bindpwd) {
        return reject("No bind password was provided.");
      }
      break;
    case PasswordMode.secretStorage:
      bindpwd = await context.secrets.get(this.getName());
      if (!bindpwd) {
        return reject(`No password for connection "${this.getName()}" found in secret storage.`);
      }
      break;
    case PasswordMode.settings:
    default:
      // Default option (i.e. when the connection has no password mode) = read
      // password from VS Code settings (this was the only storage mode
      // available  before this extension started to support password modes).
      bindpwd = this.getBindPwd(true);
    }

    // Bind.
    client.bind(this.getBindDn(true), bindpwd, (err) => {
      if (err) {
        return reject(`Unable to bind: ${err.message}`);
      }

      // Search.
      searchOptions.sizeLimit = parseInt(this.getLimit(true));
      try {
        client.search(base ?? this.getBaseDn(true), searchOptions, (err, res) => {
          if (err) {
            return reject(err.message);
          }

          // Check if user wants to sort attributes alphabetically.
          const sortAttributes = workspace.getConfiguration('ldap-explorer').get('sort-attributes', false);

          let results: SearchEntry[] = [];
          res.on('searchRequest', (searchRequest) => {
            LdapLogger.appendLine(`Search request: ${JSON.stringify(searchRequest)}`);
          });
          res.on('searchEntry', (entry) => {
            // Sort attributes alphabetically by name, if user wants to.
            if (sortAttributes) {
              entry.attributes.sort((attribute1: Attribute, attribute2: Attribute) => {
                return attribute1.type.localeCompare(attribute2.type);
              });
            }
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
