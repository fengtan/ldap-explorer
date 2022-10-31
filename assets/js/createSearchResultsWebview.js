// Add a row (search result) to the grid when receiving data from the extension.
window.addEventListener('message', event => {
  switch (event.data.command) {
  case 'addRow':
    const grid = document.getElementById("grid");
    const row = event.data.row;
    grid.rowsData = grid.rowsData.concat([row]);
    break;
  }
});
