const vscode = acquireVsCodeApi();

function submitForm(command) {
  vscode.postMessage({
    command: command,
    name: document.getElementById("name").value,
    protocol: document.getElementById("protocol").value,
    // starttls and verifycert return a string instead of a boolean) to
    // accomodate the variable type defined in package.json (user is allowed to
    // store those as environment variables).
    starttls: document.getElementById("starttls").checked ? "true" : "false",
    verifycert: document.getElementById("verifycert").checked ? "true" : "false",
    sni: document.getElementById("sni").value,
    host: document.getElementById("host").value,
    port: document.getElementById("port").value,
    binddn: document.getElementById("binddn").value,
    bindpwd: document.getElementById("bindpwd").value,
    basedn: document.getElementById("basedn").value,
    limit: document.getElementById("limit").value,
    timeout: document.getElementById("timeout").value
  });
}

function updateFieldsVisibility() {
  var protocol = document.getElementById("protocol").value;
  var starttls = document.getElementById("starttls").checked;

  // Show StartTLS checkbox only if drop-down Protocol is set to "ldap".
  document.getElementById("starttls").style["display"] = (protocol === "ldap") ? "" : "none";

  // Show TLS options ("Verify Cert" and SNI fields) only if one of these conditions is met:
  // 1. Protocol is set to "ldaps"
  // 2. Protocol is set to "ldap" and StartTLS checkbox is checked
  document.getElementById("tlsoptions").style["display"] = ((protocol === "ldaps") || (protocol === "ldap" && starttls)) ? "" : "none";
}

// Initialize fields visibility when loading the webview.
document.addEventListener('DOMContentLoaded', function () {
  updateFieldsVisibility();
}, false);
