import { CancellationToken, ExtensionContext, WebviewView, WebviewViewProvider, WebviewViewResolveContext } from "vscode";
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
            <!-- TODO prepopulate "value" with memento ? Otherwise it gets reset when goes to the background-->
            <vscode-text-field type="text" id="filter" placeholder="e.g. cn=readers">Filter</vscode-text-field><!-- TODO verify the example in the placeholder is a valid LDAP filter -->
          </section>
          <section>
            <!-- when parsing the text area make sure we account for windows-style CRLF -->
            <vscode-text-area id="attributes" placeholder="e.g. member">Attributes</vscode-text-area><!-- TODO explain, one attribute per line -->
          </section>

          <vscode-button onClick="">Search</vscode-button><!-- TODO onClick -->
        </body>
			</html>`;
  }

}
