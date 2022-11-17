const vscode = acquireVsCodeApi();

function submitForm(command) {
  vscode.postMessage({
    command: command,
    name: document.getElementById("name").value,
    protocol: document.getElementById("protocol").value,
    // String (not a boolean) to accomodate the variable type defined in package.json
    // (user is allowed to store this variable as an environment variable).
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
