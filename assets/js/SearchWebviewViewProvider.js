const vscode = acquireVsCodeApi();

function search() {
  vscode.postMessage({
    command: "search",
    filter: document.getElementById("filter").value,
    attributes: document.getElementById("attributes").value
  });
}

// Submit form when user focuses on filter text field and hits "Enter".
(function () {
  document.getElementById("filter").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      // Cancel the default action.
      event.preventDefault();
      // Trigger the search button element with a click.
      document.getElementById("search").click();
    }
  });
})();
