# Change Log

All notable changes to this extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/fengtan/ldap-explorer/compare/1.1.0...HEAD
[1.1.0]: https://github.com/fengtan/ldap-explorer/compare/1.0.1...1.1.0
[1.0.1]: https://github.com/fengtan/ldap-explorer/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/fengtan/ldap-explorer/releases/tag/1.0.0
