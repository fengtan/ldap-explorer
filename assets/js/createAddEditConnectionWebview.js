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
    pwdmode: document.getElementById("pwdmode").value,
    bindpwd: document.getElementById("bindpwd").value,
    basedn: document.getElementById("basedn").value,
    limit: document.getElementById("limit").value,
    paged: document.getElementById("paged").checked ? "true" : "false",
    connectTimeout: document.getElementById("connectTimeout").value,
    timeout: document.getElementById("timeout").value
  });
}

// Reveal / hide the bind password field.
function toggleBindPwdVisibility() {
  const type = document.getElementById("bindpwd").type;
  document.getElementById("bindpwd").type = (type === "password")
    ? "text"
    : "password";
  updateBindPwdIcon();
}

// If bind password is revealed, show button with icon to hide it.
// If it is hidden, show button with icon to reveal it.
function updateBindPwdIcon() {
  const type = document.getElementById("bindpwd").type;
  document.getElementById("bindpwd-toggle").className = (type === "password")
    ? "codicon codicon-eye"
    : "codicon codicon-eye-closed";
}

function updateFieldsVisibility() {
  var protocol = document.getElementById("protocol").value;
  var starttls = document.getElementById("starttls").checked;
  var pwdmode = document.getElementById("pwdmode").value;

  // Show StartTLS checkbox only if drop-down Protocol is set to "ldap".
  document.getElementById("starttls").style["display"] = (protocol === "ldap") ? "" : "none";

  // Show TLS options ("Verify Cert" and SNI fields) only if one of these conditions is met:
  // 1. Protocol is set to "ldaps"
  // 2. Protocol is set to "ldap" and StartTLS checkbox is checked
  document.getElementById("tlsoptions").style["display"] = ((protocol === "ldaps") || (protocol === "ldap" && starttls)) ? "" : "none";

  // Show Bind Password field only if password mode is "secret" or "settings"
  // (there is no ned to ask for a password if the mode is "ask" or "anonymous").
  // See PasswordMode.ts.
  document.getElementById("bindpwd-container").style["display"] = ((pwdmode === "secret") || (pwdmode === "settings")) ? "" : "none";
}

// Initialize fields visibility & icons when loading the webview.
document.addEventListener('DOMContentLoaded', function () {
  updateFieldsVisibility();
  updateBindPwdIcon();
}, false);
