// Populate grid in webview when receiving data from the extension.
window.addEventListener('message', event => {
  switch (event.data.command) {
  case 'populate':
    const grid = document.getElementById("grid");
    // Column titles.
    grid.columnDefinitions = [
      { columnDataKey: "name", title: "Attribute" },
      { columnDataKey: "value", title: "Value" },
    ];
    // Data (rows).
    grid.rowsData = event.data.rowsData;
    break;
  }
});


(function () {
  const vscode = acquireVsCodeApi();

  // Clicking the "Export CSV" button in the webview sends a message back to the
  // extension which then generates and downloads the CSV file.
  const exportCSV = document.getElementById("export-csv");
  exportCSV.addEventListener("click", function () {
    // Send message to extension.
    vscode.postMessage({
      "command": "export-csv"
    });
  }, false);

}());
