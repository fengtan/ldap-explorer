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

/**
 * Formats a value so it can be inserted into a CSV file:
 * 1. Wraps the value with double quotes
 * 2. Escapes any double quote the value may contains (the right way to escape
 * double quotes in CSV is to double them i.e. replace " with "")
 */
export function formatCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}