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
