import { CancellationToken, ExtensionContext, WebviewView, WebviewViewProvider, WebviewViewResolveContext, window } from "vscode";
import { createSearchResultsWebview } from "./createSearchResultsWebview";
import { LdapConnectionManager } from "../LdapConnectionManager";
import { getUri, getWebviewUiToolkitUri } from './utils';

/**
 * Webview that shows the search form ("Search" view).
 */
export class SearchWebviewViewProvider implements WebviewViewProvider {

  private context: ExtensionContext;
  private connectionManager: LdapConnectionManager;

  constructor(context: ExtensionContext, connectionManager: LdapConnectionManager) {
    this.context = context;
    this.connectionManager = connectionManager;
  }

  /**
   * {@inheritDoc}
   */
  public resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext<unknown>, token: CancellationToken): void | Thenable<void> {
    // JS required for the Webview UI toolkit https://github.com/microsoft/vscode-webview-ui-toolkit
    const toolkitUri = getWebviewUiToolkitUri(webviewView.webview, this.context.extensionUri);

    // JS of the webview.
    const scriptUri = getUri(webviewView.webview, this.context.extensionUri, ["assets", "js", "SearchWebviewViewProvider.js"]);

    // Allow JS in the webview.
    webviewView.webview.options = {
      enableScripts: true
    };

    // Populate webview HTML with search form.
    webviewView.webview.html = /* html */`
    <!DOCTYPE html>
			<html lang="en">
				<head>
          <!-- Webview UI toolkit requires a CSP with unsafe-inline script-src and style-src (not ideal but we have no choice) -->
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${webviewView.webview.cspSource} 'unsafe-inline'; style-src ${webviewView.webview.cspSource} 'unsafe-inline';" />
				  <script type="module" src="${toolkitUri}"></script>
				</head>
				<body>
          <section>
            <vscode-text-field type="text" id="filter" placeholder="e.g. cn=readers">Filter (<a href="https://ldap.com/ldap-filters/">help</a>) *</vscode-text-field>
          </section>
          <section>
            <vscode-text-area id="attributes" placeholder="e.g. member" resize="both" rows="10">Attributes (one attribute per line, leave empty to show all)</vscode-text-area>
          </section>

          <vscode-button id="search" onClick="search()">Search</vscode-button>

          <script src="${scriptUri}"></script>
        </body>
			</html>
    `;

    // Submit handler when user clicks the "search" button.
    // See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
    webviewView.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
        case 'search':
          // Get active connection.
          const connection = this.connectionManager.getActiveConnection();
          if (connection === undefined) {
            window.showErrorMessage(`No active connection`);
            return;
          }

          // Filter field is mandatory: verify it is not empty.
          if (!message.filter) {
            window.showErrorMessage(`Empty field "Filter", please provide a value`);
            return;
          }

          // Extract array of attributes to show.
          // The attributes provided by the user in the textarea are split by newline.
          // If the user left the textarea empty then show all attributes i.e. make 'attributes' undefined.
          const attributes = (message.attributes === '') ? undefined : message.attributes.split(/\r?\n/);

          // Show search results in a webview.
          createSearchResultsWebview(this.context, connection, message.filter, attributes);
          break;
        }
      },
      undefined,
      this.context.subscriptions
    );

  }

}
