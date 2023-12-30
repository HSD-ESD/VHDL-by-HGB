# Contributing

## Project setup

1. Clone the repository
    - Open terminal and enter `git clone https://github.com/HSD-ESD/VHDL-by-HGB.git`
    - Get submodules -> Open terminal and enter `git submodule update --init --recursive`
2. Install `nodejs (LTS)`
3. Run `npm install` at the project root to install dependencies.
4. Everything should setup! (The language server will be downloaded automatically when the extension is started for the first time)

5.  In case you want to contribute to the language server, you have to compile the language 
    server according to [Rust HDL](https://github.com/kraigher/rust_hdl).
    To debug the language server with `"vhdl-by-hgb.vhdlls.languageServer = embedded"` the `vhdl_ls` binary must be placed in the ./server directory of the extension project.

## Client

The source for the client is located at src/** 
Snippets are defined in ./snippets
Syntaxes are defined in ./syntaxes
Images are defined in ./resources

## Debugging

Press `F5` to start debugging.
In Debug-Mode, a Javascript-File will be generated for each Typescript-File to simplify debugging.

## Packaging a VSIX

A VSIX file is a local package of the extension which can be installed into VSCode. To generate a `VSIX` package, run `vsce package` at the project root. 
The VSIX `vhdl-ls-<version>.vsix` is generated at the project root.
In Packaging-Mode, only one Javascript-File will be generated(bundled) for the whole project
to minify dependencies and install-size for the customer.

The VSIX can be installed by:

- Command line: `code --install-extension vhdl-ls-<version>.vsix`
- [Via GUI](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix)
