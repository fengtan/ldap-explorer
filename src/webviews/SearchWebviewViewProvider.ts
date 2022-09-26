import { CancellationToken, ExtensionContext, WebviewView, WebviewViewProvider, WebviewViewResolveContext, window } from "vscode";
import { createSearchResultsWebview } from "./createSearchResultsWebview";
import { LdapConnectionManager } from "../LdapConnectionManager";
import { getWebviewUiToolkitUri } from './utils';

export class SearchWebviewViewProvider implements WebviewViewProvider {

  private extensionContext: ExtensionContext;

  constructor(extensionContext: ExtensionContext) {
    this.extensionContext = extensionContext;
  }

  resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext<unknown>, token: CancellationToken): void | Thenable<void> {
    const toolkitUri = getWebviewUiToolkitUri(webviewView.webview, this.extensionContext.extensionUri);

    webviewView.webview.options = {
      enableScripts: true
    };

    webviewView.webview.html = `<!DOCTYPE html>
			<html lang="en">
				<head>
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

          <script>
            const vscode = acquireVsCodeApi();
            function search() {
              vscode.postMessage({
                command: "search",
                filter: document.getElementById("filter").value,
                attributes: document.getElementById("attributes").value
              });
            }
            // Submit form when user focuses on filter text field and hits "Enter".
            (function() {
              document.getElementById("filter").addEventListener("keypress", function(event) {
                if (event.key === "Enter") {
                  // Cancel the default action.
                  event.preventDefault();
                  // Trigger the search button element with a click.
                  document.getElementById("search").click();
                }
              });
            })();
			    </script>
        </body>
			</html>`;

    // Submit handler when user clicks the "search" button.
    // See https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
    webviewView.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
        case 'search':
          // Get active connection.
          const connection = LdapConnectionManager.getActiveConnection(this.extensionContext);
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
          createSearchResultsWebview(this.extensionContext, connection, message.filter, attributes);
          break;
        }
      },
      undefined,
      this.extensionContext.subscriptions
    );

  }

}
