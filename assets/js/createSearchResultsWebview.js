window.addEventListener('message', event => {
  switch (event.data.command) {
  case 'addRow':

    // Add a row (search result) to the grid when receiving data from the extension.
    const grid = document.getElementById("grid");
    const row = event.data.row;
    grid.rowsData = grid.rowsData.concat([row]);

    // Update search results counter.
    const counter = document.getElementById("counter");
    const count = grid.rowsData.length;
    counter.innerText = count + " " + (count <=1 ? "result" : "results");

    break;
  }
});

(function () {
  const vscode = acquireVsCodeApi();

  // Clicking the "Export CSV" button in the webview sends a message back to the
  // extension which then generates and downloads the CSV file.
  const exportCSV = document.getElementById("export-csv");
  exportCSV.addEventListener("click", function() {
    // Get list of attributes to export from the grid.
    const grid = document.getElementById("grid");
    const attributes = grid.columnDefinitions.map(columnDefinition => columnDefinition.columnDataKey);
    // Send message to extension.
    vscode.postMessage({
      "command": "export-csv",
      "attributes": attributes
    });
  }, false);

}());
