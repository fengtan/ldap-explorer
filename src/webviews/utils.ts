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
 * Formats an array of values into a line so it can be inserted into a CSV file:
 * 1. Wraps values with double quotes
 * 2. Escapes any double quote the values may contains
 * 3. Joins all values with a comma
 */
export function formatCsvLine(values: (string | string[])[]) {
  // The right way to escape double quotes in CSV is to double them
  // i.e.replace " with ""
  const valuesEscaped = values.map((value) => `"${value.toString().replace(/"/g, '""')}"`);
  return valuesEscaped.join(",") + "\n";
}
