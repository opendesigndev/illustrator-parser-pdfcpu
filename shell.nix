{ pkgs ? import <nixpkgs> { }, goPkgs ? import (builtins.fetchTarball {
  name = "nixpkgs-2022-11-03";
  url =
    "https://github.com/nixos/nixpkgs/archive/872fceeed60ae6b7766cc0a4cd5bf5901b9098ec.tar.gz";
  sha256 = "1fhv0lfj7khfr0fvwbpay3vq3v7br86qq01yyl0qxls8nsq08y0c";
}) { } }:

with pkgs;

mkShell {
  buildInputs = [
    # wasm_exec.js changes based on Go version - so we need to be very cautious around upgrading it.
    # see notes on src/wasm-context/go.ts
    goPkgs.go
    goPkgs.gocode
    goPkgs.gopls
    nodejs-slim-18_x
    nodePackages.npm
  ];

  nativeBuildInputs =
    [ wget graphviz-nox nodePackages.typescript-language-server ];
}
