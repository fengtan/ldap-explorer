import { CancellationToken, WebviewView, WebviewViewProvider, WebviewViewResolveContext } from 'vscode';

// @todo prepend name with ldap for consistency
export class SearchViewProvider implements WebviewViewProvider {

    private _view?: WebviewView;

    resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext<unknown>, token: CancellationToken): void | Thenable<void> {
        this._view = webviewView;
        // @todo form does not show up in view
        webviewView.webview.html = `<!DOCTYPE html>
        <html lang="en">
        <head>
        </head>
        <body>
            <p>Foo Bar</p>
        </body>
        </html>`;
    }

}