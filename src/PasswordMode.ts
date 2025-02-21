export enum PasswordMode {

  // Store bind password encrypted in VS Code secret store.
  // This member value is also hardcoded in createAddEditConnectionWebview.js.
  secretStorage = "secret",

  // Store bind password as plain text in VS Code settings.
  // This member value is also hardcoded in createAddEditConnectionWebview.js.
  settings = "settings",

  // Ask for bind password everytime a connection is made.
  ask = "ask",

}
