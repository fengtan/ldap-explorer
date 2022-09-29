import { OutputChannel, window } from "vscode";

export class LdapLogger {

  private static outputChannel: OutputChannel = window.createOutputChannel("LDAP Explorer");

  static appendLine(value: string) {
    this.outputChannel.appendLine(value);
  }

}
