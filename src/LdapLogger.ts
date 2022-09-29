import { OutputChannel, window } from "vscode";

/**
 * Logs lines to VS Code, in a dedicated channel "LDAP Explorer".
 */
export class LdapLogger {

  private static outputChannel: OutputChannel = window.createOutputChannel("LDAP Explorer");

  /**
   * Append a line to the logs.
   */
  public static appendLine(value: string) {
    this.outputChannel.appendLine(value);
  }

}
