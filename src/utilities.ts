import path = require("path");
import { Uri, Webview } from "vscode";

/**
 * Utility function to get the webview URI of a given file.
 */
export function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

/**
 * Utility function to get the URI of the Webview UI toolkit.
 *
 * @see https://github.com/microsoft/vscode-webview-ui-toolkit
 * @todo drop arguments webview + extensionUri, they should not be needed.
 */
export function getWebviewUiToolkitUri(webview: Webview, extensionUri: Uri) {
    const pathList: string[] = [
        "node_modules",
        "@vscode",
        "webview-ui-toolkit",
        "dist",
        "toolkit.js",
    ];
    return getUri(webview, extensionUri, pathList);
}
