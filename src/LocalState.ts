// Used to persist application state via Mementos.

import { ExtensionContext } from "vscode";
import { LdapConnection } from './LdapConnection';
import { LdapConnectionManager } from "./LdapConnectionManager";

export class LocalState {

  private context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  // @todo return thenable, just like getActiveConnection() ?
  public setActiveConnection(connectionName: string) {
    this.context.globalState.update('active-connection', connectionName);
  }

  // @todo would be way easier to return LdapConnection than the connection name, encapsulate stuff and save code
  public getActiveConnection(): string | undefined {
    return this.context.globalState.get('active-connection');
  }

}
