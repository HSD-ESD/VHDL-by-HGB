
'use strict';

// general imports
import * as vscode from 'vscode';

// specific imports
import { EmacsVHDLFormatterDocumentFormattingEditProvider } from './emacs_vhdl_formatter/emacs_vhdl_formatter';
import { VHDLFormatterDocumentFormattingEditProvider } from './vhdl_formatter/vhdl_formatter';

export class VHDLFormatterHGB
{
    // --------------------------------------------
    // Private members
    // --------------------------------------------

    // vs-code
    private mContext : vscode.ExtensionContext;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(context: vscode.ExtensionContext)
    {
        this.mContext = context;

        this.registerFormatter();
    }

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private registerFormatter() : void
    {
        let disposable = vscode.languages.registerDocumentFormattingEditProvider(
            "vhdl",
            new VhdlbyHgbDocumentFormattingEditProvider()
        );
        this.mContext.subscriptions.push(disposable);
    }

}

enum eFormatter {
    vhdl_formatter,
	emacs_vhdl_formatter
}

export class VhdlbyHgbDocumentFormattingEditProvider implements vscode.DocumentFormattingEditProvider
{
    // --------------------------------------------
    // Private members
    // --------------------------------------------

    // formatters
    private mVHDLFormatter : VHDLFormatterDocumentFormattingEditProvider;
    private mEmacsVHDLFormatter : EmacsVHDLFormatterDocumentFormattingEditProvider;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor() 
    {
        this.mVHDLFormatter = new VHDLFormatterDocumentFormattingEditProvider();
        this.mEmacsVHDLFormatter = new EmacsVHDLFormatterDocumentFormattingEditProvider();
    }

    public async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
    ): Promise<vscode.TextEdit[]> {

        let selectedFormatter = vscode.workspace
            .getConfiguration()
            .get('vhdl-by-hgb.formatter');
        let formatter = selectedFormatter as keyof typeof eFormatter;

        let textEdit : vscode.TextEdit[] = [];
        
        switch(formatter)
        {
            case "vhdl_formatter":
                textEdit = this.mVHDLFormatter.provideDocumentFormattingEdits(document, options, token);
                break;

            case "emacs_vhdl_formatter":
                textEdit = await this.mEmacsVHDLFormatter.provideDocumentFormattingEdits(document, options, token);
                break;

            default:
                textEdit = this.mVHDLFormatter.provideDocumentFormattingEdits(document, options, token);
                break;
        }

        return textEdit;
    }

}
