import * as vscode from "vscode";
import cp = require("child_process");

export let outputChannel =
  vscode.window.createOutputChannel("VHDLbyHGB.emacs-vhdl-format");

export function getEvalLispString(basicOffset: number, customEval: string) {
  return `(let (vhdl-file-content next-line) (while (setq next-line (ignore-errors (read-from-minibuffer ""))) (setq vhdl-file-content (concat vhdl-file-content next-line "\n"))) (with-temp-buffer (vhdl-mode) ${customEval} (setq vhdl-basic-offset ${basicOffset}) (insert vhdl-file-content) (vhdl-beautify-region (point-min) (point-max)) (princ (buffer-string))))`;
}

export class EmacsVHDLFormatterDocumentFormattingEditProvider
  implements vscode.DocumentFormattingEditProvider
{
  public provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions | null,
    token: vscode.CancellationToken | null
  ): Thenable<vscode.TextEdit[]> {
    return new Promise((resolve, reject) => {
      let pluginConfig = vscode.workspace.getConfiguration(
        "vhdl-by-hgb.emacs-vhdl-formatter"
      );
      let editorConfig = vscode.workspace.getConfiguration("editor");

      let stdout = "";
      let stderr = "";

      let executable: string | undefined;
      let extraArgs: string[];
      if (process.platform === "win32") {
        executable = pluginConfig.get<string>("executable.windows");
        extraArgs = (pluginConfig.get<string>("extraArgs.windows") as string)
          .trim()
          .split(" ");
      } else {
        executable = pluginConfig.get<string>("executable.unix");
        extraArgs = [];
      }

      if (executable && executable.trim()) {
        executable = executable.trim();
      } else {
        return reject("The executable of emacs must be defined!");
      }
      let basicOffset: number;
      if (options) {
        basicOffset = options.tabSize as number;
      } else {
        basicOffset = editorConfig.get<number>("tabSize") as number;
      }
      let customEval = (
        pluginConfig.get<string>("customEval") as string
      ).trim();
      let arglist = extraArgs.concat([
        "--batch",
        "--eval",
        getEvalLispString(basicOffset, customEval),
      ]);

      let child = cp.spawn(executable, arglist, {
        cwd: vscode.workspace.rootPath,
      });

      child.stdin.end(document.getText().replace(/\r\n/gi, "\n"));
      child.stdout.on("data", (chunk) => (stdout += chunk));
      child.stderr.on("data", (chunk) => (stderr += chunk));

      child.on("error", (err) => {
        if (err && (<any>err).code === "ENOENT") {
          vscode.window.showInformationMessage(
            `The '${executable}' command is not available. Please check your emacs-vhdl-formatter.executable user setting and ensure Emacs is installed.`
          );
          return resolve([]);
        }
        return reject(err);
      });

      child.on("close", (code) => {
        try {
          if (code !== 0) {
            outputChannel.show();
            outputChannel.clear();
            outputChannel.appendLine(stderr);
            return reject("Formatting failed!");
          }

          return resolve(this.insertEdits(document, stdout));
        } catch (e) {
          return reject(e);
        }
      });

      if (token) {
        token.onCancellationRequested(() => {
          child.kill();
          return reject("Cancelation requested");
        });
      }
    });
  }

  public formatDocument(
    document: vscode.TextDocument
  ): Thenable<vscode.TextEdit[]> {
    return this.provideDocumentFormattingEdits(document, null, null);
  }

  private insertEdits(
    document: vscode.TextDocument,
    formattedCodeContent: string
  ): vscode.TextEdit[] {
    let start = document.lineAt(0).range.start;
    let end = document.lineAt(document.lineCount - 1).range.end;
    let range = new vscode.Range(start, end);

    return [vscode.TextEdit.replace(range, formattedCodeContent)];
  }
}