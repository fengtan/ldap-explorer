const vscode = acquireVsCodeApi();

function submitForm(command) {
  vscode.postMessage({
    command: command,
    name: document.getElementById("name").value,
    protocol: document.getElementById("protocol").value,
    host: document.getElementById("host").value,
    port: document.getElementById("port").value,
    binddn: document.getElementById("binddn").value,
    bindpwd: document.getElementById("bindpwd").value,
    basedn: document.getElementById("basedn").value,
    limit: document.getElementById("limit").value,
    timeout: document.getElementById("timeout").value
  });
}
