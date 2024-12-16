import { Attribute } from 'ldapjs';
import { Uri, Webview, workspace } from 'vscode';

/**
 * Convert binary data to Base 64.
 */
function binaryToBase64(binary: Buffer) {
  return btoa(String.fromCharCode(...binary));
}

/**
 * Convert binary data to a UUID.
 *
 * The curly braced string representation is used.
 *
 * @see https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/001eec5a-7f8b-4293-9e21-ca349392db40
 * @see https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/222af2d3-5c00-4899-bc87-ed4c6515e80d
 * @see https://en.wikipedia.org/wiki/Universally_unique_identifier
 * @see https://github.com/fengtan/ldap-explorer/pull/60
 */
function binaryToUUID(binary: Buffer) {
  const dashPos = [4, 6, 8, 10];
  let uuid = "";

  for (let i = 0; i < binary.length; i++) {
    if (dashPos.includes(i)) {
      uuid += "-";
    }
    uuid += binary[i].toString(16).padStart(2, "0");
  }

  return "{" + uuid + "}";
}

/**
 * Return attribute value (decoded if binary, raw otherwise).
 */
export function decodeAttribute(attribute: Attribute) {

  // Get settings about binary attributes.
  const binaryDecode: boolean = workspace.getConfiguration('ldap-explorer').get('binary-decode', true);
  const binaryAttributes: string[] = workspace.getConfiguration('ldap-explorer').get('binary-attributes', [
    "caCertificate",
    "jpegPhoto",
    "krbExtraData",
    "msExchArchiveGUID",
    "msExchBlockedSendersHash",
    "msExchMailboxGuid",
    "msExchSafeSendersHash",
    "networkAddress",
    "objectGUID",
    "objectSid",
    "userCertificate",
    "userSMIMECertificate"
  ]).map((attributeName: string) => attributeName.toLowerCase());

  // Binary attribute objectGUID: render as UUID.
  if (binaryDecode && (attribute.type.toLowerCase() === "objectGUID".toLowerCase())) {
    return attribute.buffers.map(buffer => binaryToUUID(buffer));
  }

  // Binary attribute (not objectGUID): render as Base64.
  if (binaryAttributes.includes(attribute.type.toLowerCase())) {
    return attribute.buffers.map(buffer => binaryToBase64(buffer));
  }

  // Regular attribute.
  return attribute.vals;
}

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
