# VHDLbyHGB

VHDLbyHGB is a Visual Studio Code extension for editing VHDL-Projects.

This Extension is maintained by Jakob Jungreuthmayer, Sonja Schoissengaier and Florian Lucut at [University of Applied Sciences Upper Austria - Campus Hagenberg](https://www.fh-ooe.at/campus-hagenberg/studiengaenge/bachelor/hardware-software-design/).

## Technology
This extension is based on the [VHDL-LS](https://github.com/VHDL-LS/rust_hdl#vhdl-language-server) Language Server. 
Pre-compiled binaries for Linux and Windows are provided with the extension.

The server can also be loaded from either the system path or Docker depending
on the value of the `vhdl-by-hgb.vhdlls.languageServer` property.
- `embedded`: Use the embedded binary.
- `user`: Use path provided by user in `vhdl-by-hgb.vhdlls.languageServerUserPath` property.
- `systemPath`: Run `vhdl_ls` from path.
- `docker`: Use [docker image](https://hub.docker.com/r/kraigher/vhdl_ls) (Only supports files below workspace root)

## Usage
The language server needs to know the library mapping of the VHDL files in the project, for this purpose it reads a configuration file in the [TOML](https://github.com/toml-lang/toml) format named `vhdl_ls.toml`.
The file contains the library mapping of all files within the project and should be located in the workspace root. 
Files outside of the project without library mapping are checked for syntax errors only.  
  
`vhdl_ls` will load configuration files in the following order of priority (first to last):
1. A file named `.vhdl_ls.toml` in the user home folder.
2. A file name from the `VHDL_LS_CONFIG` environment variable.
3. A file named `vhdl_ls.toml` in the workspace root.

Library definitions in later files redefines those from previously loaded files.

**Example vhdl_ls.toml**
```toml
# File names are either absolute or relative to the parent folder of the
# vhdl_ls.toml file and supports glob-style patterns.

[libraries]

# Defines library lib2
lib2.files = [
  'pkg2.vhd',
  'src/**/*.vhd',
]

# Defines library lib1
lib1.files = [
  'pkg1.vhd',
  'tb_ent.vhd',
]
```

## Project-Setup

1. Open your whole VHDL-project as folder in VS-Code
2. The `vhdl_ls.toml` will be placed in the root of the project

	The language server only starts automatically, if a folder contains a `vhdl_ls.toml` in its root-directory.
  	Therefore, you have to initialise every project as a VHDL-Project once.
  	This avoids starting the language-server accidentally on projects and getting unwanted error-messages. 

3. By invoking the command `VHDLbyHGB.Project.Setup`, the opened folder is set up as a VHDL-Project.
	By default, a `vhdl_ls.toml` will be generated automatically for you containing the vhdl-files in all subfolders.

	The extension offers the following options for generating the `vhdl_ls.toml` via the property 
	`vhdl-by-hgb.vhdlls.toml.generation`:

### auto 
- `vhdl_ls.toml` is generated automatically:

	By invoking the command `VHDLbyHGB.Simulation.SetActiveProject`, a simulation-project in your vhdl-project
	can be configured.

	Supported Tools:
	- VUnit
	- HDLRegression

	As a consequence of setting an active Simulation-Project, the `vhdl_ls.toml` will be generated automatically
	from the source-information from these projects.

### manual 
- `vhdl_ls.toml` must be generated manually by user e.g. via a custom python-script


## LSP-Features
- Live syntax and type checking 
- Finds missing, duplicate and unused declarations
- Goto-definition/declaration (also in presence of overloading)
- Find-all-references (also in presence of overloading)
- Goto-implementation
- From component declaration to matching entity by default binding
- From entity to matching component declaration by default binding
- Hovering symbols reveals more information
- Renaming symbols
- Finding workspace symbols
- Viewing/finding document symbols

## Formatting

### Using Command Palette

- macOS: `CMD` + `SHIFT` + `P`
- Windows: `CTRL` + `SHIFT` + `P`

And type `Format Document`

### Keyboard Shortcuts

- macOS: `SHIFT` + `OPTION` + `F`
- Windows: `SHIFT` + `ALT` + `F`

If you don't like the default shortcuts, you can rebind `editor.action.formatDocument` in the keyboard shortcuts menu of VSCode.

### Supported Formatters
The property `vhdl-by-hgb.formatter` lets you choose between one of the following formatters:

#### vhdl_formatter [VHDLFormatter by g2384](https://github.com/g2384/VHDLFormatter)

The following configuration-options are available:

| Key                                         | Default     | Values                   |
|---------------------------------------------|-------------|--------------------------|
| `vhdl-by-hgb.formatter.insertFinalNewline`  | `false`     | `true/false`             |
| `vhdl-by-hgb.formatter.replaceByAliases`    | `false`     | `true/false`             |
| `vhdl-by-hgb.formatter.indentation`         | `tabSize`   | `String`                 |
|                                             |             |                          |
| `vhdl-by-hgb.formatter.align.mode`          | `Local`     | `Local/Global`           |
| `vhdl-by-hgb.formatter.align.all`           | `false`     | `true/false`             |
| `vhdl-by-hgb.formatter.align.port`          | `false`     | `true/false`             |
| `vhdl-by-hgb.formatter.align.function`      | `false`     | `true/false`             |
| `vhdl-by-hgb.formatter.align.procedure`     | `false`     | `true/false`             |
| `vhdl-by-hgb.formatter.align.generic`       | `false`     | `true/false`             |
| `vhdl-by-hgb.formatter.align.comments`      | `false`     | `true/false`             |
|                                             |             |                          |
| `vhdl-by-hgb.formatter.case.keyword`        | `UpperCase` | `UpperCase/LowerCase`    |
| `vhdl-by-hgb.formatter.case.typename`       | `UpperCase` | `UpperCase/LowerCase`    |
|                                             |             |                          |
| `vhdl-by-hgb.formatter.newline.port`        | `None`      | `NewLine/NoNewLine/None` |
| `vhdl-by-hgb.formatter.newline.then`        | `NewLine`   | `NewLine/NoNewLine/None` |
| `vhdl-by-hgb.formatter.newline.semicolon`   | `NewLine`   | `NewLine/NoNewLine/None` |
| `vhdl-by-hgb.formatter.newline.else`        | `NewLine`   | `NewLine/NoNewLine/None` |
| `vhdl-by-hgb.formatter.newline.generic`     | `None`      | `NewLine/NoNewLine/None` |
|                                             |             |                          |
| `vhdl-by-hgb.formatter.remove.comments`     | `false`     | `true/false`             |
| `vhdl-by-hgb.formatter.remove.blankLines`   | `false`     | `true/false`             |
| `vhdl-by-hgb.formatter.remove.reports`      | `false`     | `true/false`             |


#### emacs_vhdl_formatter [Emacs-VHDL-Mode-Formatter](https://iis-people.ee.ethz.ch/~zimmi/emacs/vhdl-mode.html)

emacs is called in batch mode, gets the content of the VHDL file over stdin and returns the formatted code over stdout.

The `vhdl-by-hgb.emacs-vhdl-formatter.customEval` option allows you to extend the evaluated
elisp code. This feature allows you to customize the VHDL style before you
format the code. In most cases you want to adjust the `vhdl-offsets-alist` which
defines the indentation for various components. Per default this list contains

```lisp
((string . -1000)                                -- inside multi-line string
 (block-open . 0)                                -- statement block open
 (block-close . 0)                               -- statement block close
 (statement . 0)                                 -- a VHDL statement
 (statement-cont . vhdl-lineup-statement-cont)   -- a continuation of a VHDL statement
 (statement-block-intro . +)                     -- the first line in a new statement block
 (statement-case-intro . +)                      -- the first line in a case alternative block
 (case-alternative . +)                          -- a case statement alternative clause
 (comment . vhdl-lineup-comment)                 -- a line containing only a comment
 (arglist-intro . +)                             -- the first line in an argument list
 (arglist-cont . 0)                              -- subsequent argument list lines when no
                                                    arguments follow on the same line as
                                                    the arglist opening paren
 (arglist-cont-nonempty . vhdl-lineup-arglist)   -- subsequent argument list lines when at
                                                    least one argument follows on the same
                                                    line as the arglist opening paren
 (arglist-close . vhdl-lineup-arglist)           -- the solo close paren of an argument list
 (entity . 0)                                    -- inside an entity declaration
 (configuration . 0)                             -- inside a configuration declaration
 (package . 0)                                   -- inside a package declaration
 (architecture . 0)                              -- inside an architecture body
 (package-body . 0)                              -- inside a package body
 (context . 0))                                  -- inside a context declaration
```

Use `vhdl-set-offset` function to change values in `vhdl-offsets-alist`. For
example to remove the indentation on closing brackets set
`vhdl-by-hgb.emacs-vhdl-formatter.customEval` to

```lisp
(vhdl-set-offset 'arglist-close 0)
```

## Dynamic Snippets

Dynamic Snippets are Auto-Completion-Items for entity-instantiations using information from the Language Server.
For now, Dynamic Snippets have to be updated manually.

This can be done by:
- executing the command: `VHDLbyHGB.dynamicSnippets`
- pressing the shortcut: `Ctrl+Alt+S`(default) / `shift+cmd+s`(Mac)

The generated snippets can be used by typing `ei_${entity-name}`.

## Entity-Converter

The Entity-Converter copies the entity and pastes it in different formats.

The features of the Entity-Converter can be used by:
- Context-Menu (Right-Click in code-segment of VHDL-Entity)
- Commands (see below)

`VHDLbyHGB.copyEntity`
- Set cursor within the entity declaration.
- Run the command. It copies the entity declaration

`VHDLbyHGB.pasteAsComponent`
- Pastes the entity as a component declaration

`VHDLbyHGB.pasteAsInstance`
- Pastes the entity as a instant 

`VHDLbyHGB.pasteAsEntity`
- Pastes the entity as a entity

`VHDLbyHGB.pasteSignals`
- Pastes the ports (in, out, inout, buffer) as signals

`VHDLbyHGB.pasteConstants`
- Pastes the generic definitions as constants

## Synthesis

The extension allows you to do basic operations on synthesis-projects.
Currently, only Quartus is supported but the code is open to implement support for other synthesis-tools.

The synthesis-operations are done with the comands below:

`VHDLbyHGB.Synthesis.AddNewProject`
Create a new synthesis-project

`VHDLbyHGB.Synthesis.SetActiveProject`
Set an already existing synthesis-project as active

`VHDLbyHGB.Synthesis.SetTopLevel`
Set TopLevel for a synthesis-project

`VHDLbyHGB.Synthesis.UpdateFiles`
Update files for a synthes-project based on the configured Top-Level
(requiring already having a Top-Level configured)

`VHDLbyHGB.Synthesis.Compile`
Compile synthesis-project

`VHDLbyHGB.Synthesis.LaunchGUI`
launch gui of synthesis-project

`VHDLbyHGB.Synthesis.SetDevice`
set device for synthesis-project (e.g. 5CSEMA5F31C6)

`VHDLbyHGB.Synthesis.SetFamily`
set family for synthesis-project (e.g. Cyclone V)


To execute a command on a synthesis-project, it is required to set an active synthesis-project.
All the other commands will be executed on the selected project.

When the extension is loaded, the opened folder is searched recursively for synthesis-projects of supported synthesis-tools.

## Prerequisites
- Simulation-Tools(VUnit, HDLRegression...) must be already installed for generating the `vhdl_ls.toml` with Simulation-Projects.
- Synthesis-Tools (Quartus...) must be already installed for interacting with Synthesis-Projects.

## History
An extension for vhdl_ls already exists in the marketplace:
[VHDL LS](https://marketplace.visualstudio.com/items?itemName=hbohlin.vhdl-ls).
The mentioned extension only handles the LSP-Setup.

VHDLbyHGB extends the already existing functionality and therefore is more a comprehensive extension,
making it easier to set up and work on a VHDL-Project.

## Contributing
Contributing in the form of code, documentation, feedback, tutorial, ideas or bug reports is very welcome. 

## Maintainers: 
- since 2023: 
[Jakob Jungreuthmayer](https://github.com/jakobjung10)
[Sonja Schoissengaier](https://github.com/Sonscho)
[Florian Lucut](https://github.com/flolucut)

## Configuration
- Overview at Tab `FEATURE CONTRIBUTIONS`

## Commands
- Overview at Tab `FEATURE CONTRIBUTIONS`

## Related Projects

You want to improve your workflow for HDL-Projects?
Our other extensions will help you with that!

The extensions below will improve your vhdl-verification-experience:

- [VUnitByHGB](https://marketplace.visualstudio.com/items?itemName=P2L2.vunit-by-hgb)
- [HDLRegressionByHGB](https://marketplace.visualstudio.com/items?itemName=P2L2.hdlregression-by-hgb)

## License
This extension is published under the [GNU GPL license](/LICENSE).
