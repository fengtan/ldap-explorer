import { Attribute } from 'ldapjs';
import { Uri, Webview, workspace } from 'vscode';

/**
 * Convert binary data to Base 64.
 */
function binaryToBase64(binary: Buffer) {
  return btoa(String.fromCharCode(...binary));
}

/**
 * Convert binary GUID data to its text representation (UUID).
 *
 * The curly braced string representation is used.
 *
 * @see https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/001eec5a-7f8b-4293-9e21-ca349392db40
 * @see https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/222af2d3-5c00-4899-bc87-ed4c6515e80d
 * @see https://en.wikipedia.org/wiki/Universally_unique_identifier
 * @see https://github.com/fengtan/ldap-explorer/pull/60
 */
export function binaryGUIDToTextUUID(binary: Buffer) {
  const dashPos = [4, 6, 8, 10];
  let uuid = "";

  // Active Directory stores objectGUID's in little-endian so we must reorder
  // the bytes.
  const binaryOrdered = [
    ...Array.from(binary.subarray(0, 4).reverse()),
    ...Array.from(binary.subarray(4, 6).reverse()),
    ...Array.from(binary.subarray(6, 8).reverse()),
    ...Array.from(binary.subarray(8, 16)),
  ];

  for (let i = 0; i < binary.length; i++) {
    if (dashPos.includes(i)) {
      uuid += "-";
    }
    uuid += binary[i].toString(16).padStart(2, "0");
  }

  return "{" + uuid + "}";
}

/**
 * Convert binary security identifier data to its text representation (SID).
 *
 * The curly braced string representation is used.
 *
 * @see https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/understand-security-identifiers
 * @see https://learn.microsoft.com/en-us/windows/win32/adschema/a-objectsid
 */
export function binarySIDToText(binary: Buffer) {
  if (binary.length < 8) {
    return "Invalid SID: less than 8 bytes";
  }

  const revision = binary.readUint8(0);
  const subAuthorityCount = binary.readUint8(1);

  // 6 bytes (big-endian)
  const identifierAuthority = binary.readUIntBE(2, 6);

  let sid = `S-${revision}-${identifierAuthority}`;

  // Sub authorities are 4 bytes each, starting from byte 8
  for (let i = 0; i < subAuthorityCount; i++) {
    let subAuthority = binary.readUInt32LE(8 + i * 4); // little-endian
    sid += `-${subAuthority}`;
  }

  return sid;
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
    return attribute.buffers.map(buffer => binaryGUIDToTextUUID(buffer));
  }

  // Binary attribute objectSid: render as security identifier (SID) string.
  if (binaryDecode && (attribute.type.toLowerCase() === "objectSid".toLowerCase())) {
    return attribute.buffers.map(buffer => binarySIDToText(buffer));
  }

  // Binary attribute (not decodable): render as Base64.
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
