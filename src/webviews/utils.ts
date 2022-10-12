import { Uri, Webview } from 'vscode';

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
 */
export function getWebviewUiToolkitUri(webview: Webview, extensionUri: Uri) {
  // This script must be included in the VSIX and as a result is listed as an
  // exception in .vscodeignore
  const pathList: string[] = [
    "node_modules",
    "@vscode",
    "webview-ui-toolkit",
    "dist",
    "toolkit.js",
  ];
  return getUri(webview, extensionUri, pathList);
}
