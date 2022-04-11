# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.2] - 2023-02-09

### Changed

- import map was changed to support `node16` resolution in Typescript 4.7 and later.
  In case you are using this module from CJS, you need to change import paths - now they are the same as in ESM and will be kept as such in the future.

## [1.1.1] - 2022-12-07

### Fixed

- reverted `externalResourceURLs` changes in `FSContext` to keep API backwards-compatible,

## [1.1.0] - 2022-12-06

### Added

- `wasm_context` - production-ready implementation using WebAssembly to run both in browser and Node.js

### Removed

- dependencies: `morphic-ts` and `fp-ts`,

## [1.0.3-0] - 2022-09-26

### Changed

- Removed dependencies: `morphic-ts` and `fp-ts`: they are instead bundled within the package itself.

## 1.0.0 - 2022-07-06

### Added

- Tested and benchmarked Node.js implementation.
