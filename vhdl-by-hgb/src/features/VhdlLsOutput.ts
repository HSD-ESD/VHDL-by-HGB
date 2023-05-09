//--------------------------------------------
//general imports
//--------------------------------------------
import * as vscode from 'vscode';
import { writeFileSync } from 'fs';
import { RustHDL } from './RustHDL';
import * as path from 'path';
import { DocumentSymbol } from 'vscode';
import { Position } from 'vscode';
import { SnippetString } from 'vscode';
// dynamic import

export class LsOutput {
    //--------------------------------------------
    //Private Members
    //--------------------------------------------
    //private mRustHDL : RustHDL;
    private mContext: vscode.ExtensionContext;

    private mSnip : vscode.SnippetTextEdit;

    //--------------------------------------------
    //Public Methods
    //--------------------------------------------

    public constructor(context: vscode.ExtensionContext) {
        this.mContext = context;
        this.mSnip = new vscode.SnippetTextEdit(
            new vscode.Range(new Position(0, 0), new Position(100, 100)), 
            new SnippetString("FSM example generate"));
        //this.mRustHDL = new RustHDL(this.mContext);
    }

    /*
     * Diese Funktion legt den gesamten Output des Traces auf  
     * eine File, welche dann ausgewertet werden kann und zu den 
     * Snippets hinzugefügt wird
     */
    public async GetOutput(filePath: string) {

        /*const snippet = require('../../snippets/vhdl.json');
        const msg = snippet.Entity.body
            .map((line) => line.replace(/\${1:Entity}/g, "$Hallo"))
            .map((line) =>
                line.replace(/\${2:iClk        : in std_ulogic;}/g,
                    "$iClk        : in std_logic;"))
            ;*/

        //const { default: data } = await import("../../snippets/vhdl.json", { assert: { type: "json" } });

//const vscode_1 = require("vscode");

/*
        const snippet = require("../../snippets/vhdl.json");
        //snippet ist nun ein JavaScript objekt
        const msg = snippet.Entity.body
            .map((line) => line.replace(/\${1:Entity}/g, "$Hallo"))
            .map((line) =>
                line.replace(/\${2:iClk        : in std_ulogic;}/g,
                    "$iClk        : in std_logic;"))
            ;

        const exampleSnippet = snippet['FSM example generate'];
        const names = ['World', 'John', 'Mary'];
        const options = '|' + names.join(',') + '|';
        const placeholderOptions =
            names.map(
                (name, index) => '\${${index + 1}${name}}').join('');
        const msg2 = exampleSnippet.
            replace(/\${2:\${6\|HILFE,Geh,Doch\|}}/g, options);
        //${2|rising_edge,falling_edge|}
*/

        /*
        Although, it's possible to achieve simple date-time stuff without extensions:

        "⌚ Date Time SNIPPET": {
            "prefix": "datetime",
            "body": [
                "${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}T${CURRENT_HOUR}:${CURRENT_MINUTE}:${CURRENT_SECOND}",
            ]
        }
        The question is about dynamic snippets. And here's an example of using CompletionItemProvider:

        const datetimeProvider = vscode.languages.registerCompletionItemProvider(
            {
                scheme: 'file',
                // language: 'typescript',
            },
            {
                provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                    const completionItem = new vscode.CompletionItem('datetime ⌚', vscode.CompletionItemKind.Snippet);
                    completionItem.insertText = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('.')[0];
                    return [completionItem];
                }
            },
            // ''// trigger character
        );
        */

        //this.mSnip.insert(this.mSnip.range.start)

        const newPath: string = path.join(filePath, 
            "./src/grpLedDimmable/src/LedDimmable-e.vhd");

        //holt output trace vom LanguageServer mit fixem 
        //Filename
        var documentSymbols : vscode.DocumentSymbol[] = 
        await vscode.commands.executeCommand
        <vscode.DocumentSymbol[]>
        ('vscode.executeDocumentSymbolProvider', 
        vscode.Uri.file(newPath));

        while(documentSymbols == undefined){
            documentSymbols = 
            await vscode.commands.executeCommand
            <vscode.DocumentSymbol[]>
            ('vscode.executeDocumentSymbolProvider', 
            vscode.Uri.file(newPath));        
        }

        var generics: string[] = new Array();
        var entities: string[] = new Array();
        var ports: string[] = new Array();
        var archi: string[] = new Array();

        var children: vscode.DocumentSymbol[] = new Array();

        for (let i = 0; i < documentSymbols.length; i++) {
            var child: vscode.DocumentSymbol[] = new Array();
            /*var child: string[][];
            for (let j = 0; j < documentSymbols[i].children.length; j++) {
                child[i][j] = documentSymbols[i].children[j].name;
            }*/
            child.push(documentSymbols[i]);
            if(child[i].name.includes("entity")){
                const parts = child[i].name.split("\'");
                if(parts.length === 3){
                    const nameOfGeneric = parts[1];
                    entities.push(nameOfGeneric);
                }
            }
            else if(child[i].name.includes("architecture")){
                const parts = child[i].name.split("\'");
                if(parts.length === 3){
                    const nameOfGeneric = parts[1];
                    archi.push(nameOfGeneric);
                }
            }

            for (let j = 0; j < documentSymbols[i].children.length; j++) {
                //jedes Kind wird eingefügt
                children.push(documentSymbols[i].children[j]);
                if(children[j].name.includes("generic")){
                    const parts = children[j].name.split("\'");
                    if(parts.length === 3){
                        const nameOfGeneric = parts[1];
                        generics.push(nameOfGeneric);
                    }
                }
                else if(children[j].name.includes("port")){
                    const parts = children[j].name.split("\'");
                    if(parts.length === 3){
                        const nameOfGeneric = parts[1];
                        ports.push(nameOfGeneric);
                    }
                }
            }
            //children[i] = documentSymbols[i].children;

        }



        const symbolTest: vscode.DocumentSymbolProvider[] = 
        await vscode.commands.executeCommand
        <vscode.DocumentSymbolProvider[]>
        ('vscode.executeDocumentSymbolProvider', 
        vscode.Uri.file(newPath));

        console.log("servus");

        //schreibt den Inhalt von documentSymbols in die File
        //text
        /*writeFileSync(path.join(filePath, 
            "./src/grpLedDimmable/src/text.txt"), documentSymbols, {
            flag: 'w+',
        });
        writeFileSync(path.join(filePath, 
            "./src/grpLedDimmable/src/text2.txt"), documentSymbols, {
            flag: 'w+',
        });*/
    }

    //--------------------------------------------
    //Private Methods
    //--------------------------------------------



}
