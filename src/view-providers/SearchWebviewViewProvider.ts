import { CancellationToken, WebviewView, WebviewViewProvider, WebviewViewResolveContext } from "vscode";

export class SearchWebviewViewProvider implements WebviewViewProvider {

  resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext<unknown>, token: CancellationToken): void | Thenable<void> {
    throw new Error("Method not implemented.");
  }

}
