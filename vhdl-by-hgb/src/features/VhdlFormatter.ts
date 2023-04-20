
// Specific Imports
import {Standalone_vhdl} from "colibri2/out/formatter/standalone_vhdl"; 
import {e_formatter_standalone, 
        e_formatter_standalone_keyword_case,
        e_formatter_standalone_name_case,
        e_formatter_standalone_new_line_after_else,
        e_formatter_standalone_new_line_after_generic,
        e_formatter_standalone_new_line_after_port,
        e_formatter_standalone_new_line_after_semicolon,
        e_formatter_standalone_new_line_after_then} from "colibri2/out/config/config_declaration";

//General Imports
import * as vscode from "vscode";


export class VhdlFormatter {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mFormatter : Standalone_vhdl;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(context : vscode.ExtensionContext)
    {
        this.mFormatter = new Standalone_vhdl();
        formatter = this.mFormatter;
        

        const disposable = vscode.languages.registerDocumentFormattingEditProvider(
            { scheme: "file", language: "vhdl" },
            { provideDocumentFormattingEdits }
        );
        context.subscriptions.push(disposable);
    }

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    
}

// --------------------------------------------
// module-internal variables
// --------------------------------------------
let formatter : Standalone_vhdl;
let formattingOptions : e_formatter_standalone = {
    keyword_case: e_formatter_standalone_keyword_case.lowercase,
    name_case: e_formatter_standalone_name_case.lowercase,
    indentation: "    ",
    align_port_generic: true,
    align_comment: true,
    remove_comments: false,
    remove_reports: false,
    check_alias: false,
    new_line_after_then: e_formatter_standalone_new_line_after_then.new_line,
    new_line_after_semicolon: e_formatter_standalone_new_line_after_semicolon.new_line,
    new_line_after_else: e_formatter_standalone_new_line_after_else.new_line,
    new_line_after_port: e_formatter_standalone_new_line_after_port.new_line,
    new_line_after_generic: e_formatter_standalone_new_line_after_generic.new_line
};

// --------------------------------------------
// module-internal functions
// --------------------------------------------

async function provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions,
    token: vscode.CancellationToken): Promise<vscode.TextEdit[]> {

    const edits: vscode.TextEdit[] = [];

    //Get document code
    let code_document: string = document.getText();
    let selection_document = getDocumentRange(document);

    //Get selected text
    let editor = vscode.window.activeTextEditor;
    let selection_selected_text;
    let code_selected_text: string = '';
    if (editor !== undefined) {
        selection_selected_text = editor.selection;
        code_selected_text = editor.document.getText(editor.selection);
    }

    //Code to format
    let format_mode_selection: boolean = false;
    let code_to_format: string = '';
    let selection_to_format;

    if (code_selected_text !== '') {
        let init: number = line_index_to_character_index(selection_selected_text._start._line,
            selection_selected_text._start._character, code_document);
        let end: number = line_index_to_character_index(selection_selected_text._end._line,
            selection_selected_text._end._character, code_document);
            
        format_mode_selection = true;

        code_to_format = code_selected_text;
        selection_to_format = selection_selected_text;
    }
    else {
        code_to_format = code_document;
        selection_to_format = selection_document;
    }

    let code_format: string = "";
    if (document.languageId === "vhdl") {
        code_format = (await formatter.format_from_code(code_to_format, formattingOptions)).code_formatted;
    }
    
    //Error
    if (code_format === null) {
        // vscode.window.showErrorMessage('Select a valid file.!');
        console.log("Error format code.");
        return edits;
    }
    else {
        const replacement = vscode.TextEdit.replace(
            selection_to_format,
            code_format
        );
        edits.push(replacement);
        return edits;
    }
}

const getDocumentRange = (document: vscode.TextDocument): vscode.Range => {
    const lastLineId = document.lineCount - 1;
    return new vscode.Range(
        0,
        0,
        lastLineId,
        document.lineAt(lastLineId).text.length
    );
};


function line_index_to_character_index(line_number: number, character_number: number, txt: string): number {
    let txt_split = txt.split('\n');
    let character_index: number = 0;
    for (let i = 0; i < line_number; ++i) {
        character_index += txt_split[i].length + 1;
    }
    character_index += character_number;
    return character_index;
}