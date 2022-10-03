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
