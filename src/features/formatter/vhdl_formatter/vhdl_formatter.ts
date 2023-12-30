
// general imports
import * as vscode from "vscode";

// specific imports
import * as VHDLFormatter from './VHDLFormatter/VHDLFormatter';
import * as config from "./config";

export class VHDLFormatterDocumentFormattingEditProvider
  implements vscode.DocumentFormattingEditProvider
{
    public provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
    ): vscode.TextEdit[] {

        var result: vscode.TextEdit[] = [];
        const beautifierSettings = config.getConfig(options);

        var formatted = VHDLFormatter.beautify(document.getText(), beautifierSettings);

        if (config.getExtSettings<boolean>(config.CONFIGURATION_REMOVE_BLANK_LINES, false))
        {
            const eol = beautifierSettings.EndOfLine;
            formatted = formatted.replace(new RegExp(eol + '*[ \t]*' + eol, 'g'), eol);
        }

        if (formatted)
        {
            result.push(new vscode.TextEdit(getDocumentRange(document), formatted));
        }
        return result;
    }

}


function getDocumentRange(document: vscode.TextDocument)
{
	var start = new vscode.Position(0, 0);
	var lastLine = document.lineCount - 1;
	var end = new vscode.Position(lastLine, document.lineAt(lastLine).text.length);
	return new vscode.Range(start, end);
}