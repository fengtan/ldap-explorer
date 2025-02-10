export enum PasswordMode {

  // Ask for bind password everytime a connection is made.
  // This enum member value is also hardcoded in createAddEditConnectionWebview.js.
  ask = "ask",

  // Store bind password encrypted in VS Code secret store.
  secretStorage = "secret",

  // Store bind password as plain text in VS Code settings.
  settings = "settings",

}
