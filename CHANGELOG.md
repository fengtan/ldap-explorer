# Change Log

All notable changes to this extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- Updated dependencies

## [1.3.2] - 2024-05-20
### Fixed
- Maintain bookmarks when editing connection details
### Changed
- Updated dependencies
- Upgraded build & test environments from nodejs 16 to nodejs 20
- Display bind password form field as password instead of plain text ([#58](https://github.com/fengtan/ldap-explorer/pull/58))
### Thanks
- This extension now has 10,000+ unique installations. Thanks for using it!

## [1.3.1] - 2024-04-28
### Added
- Option to disable automatic result paging ([#56](https://github.com/fengtan/ldap-explorer/issues/56))

## [1.3.0] - 2024-01-09
### Added
- Button to export results as CSV, addresses [#55](https://github.com/fengtan/ldap-explorer/issues/55)
### Changed
- Updated dependencies

## [1.2.3] - 2023-10-04
### Fixed
- Set min-width on grid columns so search results are easier to read, addresses [#52](https://github.com/fengtan/ldap-explorer/issues/52)
### Changed
- Updated dependencies

## [1.2.2] - 2023-06-21
### Fixed
- Refresh bookmarks view when adding/deleting a bookmark
### Changed
- Updated dependencies

## [1.2.1] - 2022-11-27
### Changed
- Uncheck **StartTLS** checkbox by default in new connections
- Updated dependencies

## [1.2.0] - 2022-11-23
### Added
- Support for StartTLS
- A view to let the user provide custom CA certificates
- TLS options:
  - Server Name Indication (SNI)
  - Option to skip certificate verification
### Changed
- Updated dependencies

## [1.1.1] - 2022-10-31
### Added
- Counter that shows how many search results were returned
### Changed
- Search results are now displayed *as* they are received from the LDAP server (rather than waiting for *all* results to be received) resulting in a faster user experience
### Fixed
- Alignment of headers and cells in search results grid, addresses [microsoft/vscode-webview-ui-toolkit#411](https://github.com/microsoft/vscode-webview-ui-toolkit/issues/411)

## [1.1.0] - 2022-10-26
### Added
- Command **LDAP Explorer: Reveal in Tree** (accessible either from the command palette or from the Bookmarks view)
- Button **Add to Bookmarks** to Bookmarks view
- Inline button **Copy DN to clipboard** to bookmarks

## [1.0.1] - 2022-10-11
### Fixed
- Include ldapjs and its dependencies in package, addresses [ldapjs/node-ldapjs#421](https://github.com/ldapjs/node-ldapjs/issues/421)

## [1.0.0] - 2022-10-10
### Added
- Connection management (panel, webview, commands, support for environment variables)
- Interface to browse the DIT
- Interface to list LDAP attributes
- Bookmarks management (panel, commands)
- Search interface (panel, webviews, commands)

[Unreleased]: https://github.com/fengtan/ldap-explorer/compare/1.3.2...HEAD
[1.3.2]: https://github.com/fengtan/ldap-explorer/compare/1.3.1...1.3.2
[1.3.1]: https://github.com/fengtan/ldap-explorer/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/fengtan/ldap-explorer/compare/1.2.3...1.3.0
[1.2.3]: https://github.com/fengtan/ldap-explorer/compare/1.2.2...1.2.3
[1.2.2]: https://github.com/fengtan/ldap-explorer/compare/1.2.1...1.2.2
[1.2.1]: https://github.com/fengtan/ldap-explorer/compare/1.2.0...1.2.1
[1.2.0]: https://github.com/fengtan/ldap-explorer/compare/1.1.1...1.2.0
[1.1.1]: https://github.com/fengtan/ldap-explorer/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/fengtan/ldap-explorer/compare/1.0.1...1.1.0
[1.0.1]: https://github.com/fengtan/ldap-explorer/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/fengtan/ldap-explorer/releases/tag/1.0.0
