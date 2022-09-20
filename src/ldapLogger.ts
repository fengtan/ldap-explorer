import { OutputChannel, window } from "vscode";

export class LdapLogger {

  private static outputChannel: OutputChannel = window.createOutputChannel("LDAP Explorer");

  static getOutputChannel(): OutputChannel {
    return this.outputChannel;
  }

}
