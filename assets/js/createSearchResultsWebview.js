// Populate grid in webview when receiving data from the extension.
window.addEventListener('message', event => {
  switch (event.data.command) {
  case 'populate':
    const grid = document.getElementById("grid");
    // Column titles.
    grid.columnDefinitions = event.data.columnDefinitions;
    // Data (rows).
    grid.rowsData = event.data.rowsData;
    break;
  }
});
