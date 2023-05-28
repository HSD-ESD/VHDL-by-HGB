//--------------------------------------------
//general imports
//--------------------------------------------
import * as vscode from 'vscode';
import { writeFileSync } from 'fs';
import { RustHDL } from './RustHDL';
import * as path from 'path';
//import * as path2 from 'path';
import { DocumentSymbol } from 'vscode';
import { Position } from 'vscode';
import { SnippetString } from 'vscode';
import * as fs from 'fs';

// dynamic import


//class for all entities
class Entity {
    private name: string;
    private ports: string[];
    private generics: string[];
    private architectures: Architecture[];

    constructor(name: string) {
        this.name = name;
        this.ports = [];
        this.generics = [];
        this.architectures = [];
    }

    addPort(port: string) {
        this.ports.push(port);
    }

    addGeneric(generic: string) {
        this.generics.push(generic);
    }

    addArchitecture(architecture: Architecture) {
        this.architectures.push(architecture);
    }

    getName() {
        return this.name;
    }

}

//class for all architectures
class Architecture {
    name: string;
    component: Component[];

    constructor(name: string) {
        this.name = name;
        this.component = [];
    }

    addComponent(component: Component) {
        this.component.push(component);
    }

}

//class for all components
class Component {
    name: string;
    ports: string[];
    generics: string[];

    constructor(name: string) {
        this.name = name;
        this.ports = [];
        this.generics = [];
    }

    addPort(port: string) {
        this.ports.push(port);
    }

    addGeneric(generic: string) {
        this.generics.push(generic);
    }

}

export class LsOutput {
    //--------------------------------------------
    //Private Members
    //--------------------------------------------
    //private mRustHDL : RustHDL;
    private mContext: vscode.ExtensionContext;

    private mSnip: vscode.SnippetTextEdit;

    private mEntities: Entity[] = [];

    private mArch: Architecture[] = [];

    private mFilepath: String;


    //--------------------------------------------
    //Public Methods
    //--------------------------------------------

    public constructor(context: vscode.ExtensionContext) {
        this.mContext = context;
        this.mSnip = new vscode.SnippetTextEdit(
            new vscode.Range(new Position(0, 0), new Position(100, 100)),
            new SnippetString("FSM example generate"));
        //this.mRustHDL = new RustHDL(this.mContext);
        this.SetCommand();
        this.mFilepath = new String;
    }

    /*
     * Diese Funktion legt den gesamten Output des Traces auf  
     * eine File, welche dann ausgewertet werden kann und zu den 
     * Snippets hinzugefügt wird
     */
    public async GetOutput(filePath: string) {

        //update all files
        vscode.commands.executeCommand("VHDLbyHGB.ProjectManager.UpdateFiles");

        this.mFilepath = filePath;


        var Paths: String[];
        const tomlPath = path.join(filePath, "vhdl_ls.toml");
        const tomlBuffer = fs.readFileSync(tomlPath, 'utf-8');
        const tomlLines = tomlBuffer.split('\n');

        const tomlFiles: string[] = [];

        for (const line of tomlLines) {
            const matches = line.match(/"(.*?)"/g);

            if (matches) {
                for (const match of matches) {
                    const fileName = match.slice(1, -1).replace(/\\\\/g, '/');
                    tomlFiles.push(fileName);
                }
            }
        }

        for (let idx = 0; idx < tomlFiles.length; idx++) {

            const newPath: string = path.join(filePath, tomlFiles[idx]);

            /*const newPath: string = path.join(filePath,
                "./src/grpLedDimmable/unitLedDimmable/tbd/Tbd-LedDimmableHPS-ea.vhd");
            */
            /*const newPath: string = path.join(filePath,
                "./src/grpLedDimmable/unitLedDimmable/src/LedDimmable-a.vhd");*/

            //holt output trace vom LanguageServer mit fixem 
            //Filename
            var documentSymbols: vscode.DocumentSymbol[] =
                await vscode.commands.executeCommand
                    <vscode.DocumentSymbol[]>
                    ('vscode.executeDocumentSymbolProvider',
                        vscode.Uri.file(newPath));

            while (documentSymbols == undefined) {
                documentSymbols =
                    await vscode.commands.executeCommand
                        <vscode.DocumentSymbol[]>
                        ('vscode.executeDocumentSymbolProvider',
                            vscode.Uri.file(newPath));
            }

            //-------------------------------------------------------------------------------------------------------------------------
            // Wenn ein Fehler in der Datei ist oder die architecture nicht in der selben Datei ist wie die Entity, 
            // endet das Senden nie -> ich komme nicht aus der Schleife -> es können keine Entities, Architectures 
            // etc gefunden werden
            //-------------------------------------------------------------------------------------------------------------------------

            var generics: string[] = new Array();
            //var entities: string[] = new Array();
            var ports: string[] = new Array();
            var archi: string[] = new Array();

            var children: vscode.DocumentSymbol[] = new Array();

            for (let i = 0; i < documentSymbols.length; i++) {
                //var child: vscode.DocumentSymbol[] = new Array();
                //child.push(documentSymbols[i]);
                //if (child[i].name.includes("entity")) {
                if (documentSymbols[i].name.includes("entity")) {
                    const parts = documentSymbols[i].name.split("\'");
                    if (parts.length === 3) {
                        const nameOfGeneric = parts[1];

                        //check if the entitiy does already exist in the array -> 
                        const existingEnt = this.mEntities.find(elem => elem.getName() === nameOfGeneric);
                        var newEnt;

                        //die Entity existiert schon -> lösche sie heraus und füge sie danach neu ein 
                        //-> es gibt nur eine entity nur einmal!
                        if (existingEnt) {
                            const indexToRemove = this.mEntities.indexOf(existingEnt);
                            if (indexToRemove !== -1) {
                                this.mEntities.splice(indexToRemove, 1);
                            }
                        }


                        newEnt = new Entity(nameOfGeneric);

                        /*
                        entities.push(nameOfGeneric);
                        */


                        //get everything of the entity
                        for (let j = 0; j < documentSymbols[i].children.length; j++) {
                            //jedes Kind wird eingefügt
                            children.push(documentSymbols[i].children[j]);
                            //check if there are generics
                            if (children[j].name.includes("generic")) {
                                const parts = children[j].name.split("\'");
                                if (parts.length === 3) {
                                    const nameOfGeneric = parts[1];
                                    newEnt.addGeneric(nameOfGeneric);
                                }
                            }
                            //check if there are ports
                            else if (children[j].name.includes("port")) {
                                const parts = children[j].name.split("\'");
                                if (parts.length === 3) {
                                    const nameOfGeneric = parts[1];
                                    newEnt.addPort(nameOfGeneric);
                                }
                            }
                            //check if there are architecures
                            else if (children[j].name.includes("architecture")) {
                                const parts = children[j].name.split("\'");
                                if (parts.length === 3) {

                                    const nameOfGeneric = parts[1];
                                    var newArch = new Architecture(nameOfGeneric);

                                    //archi.push(nameOfGeneric);

                                    //here would be instances and components
                                    //check if there are components
                                    for (let k = 0; k < children[j].children.length; ++k) {
                                        if (children[j].children[k].name.includes("component")) {
                                            const parts = children[j].children[k].name.split("\'");
                                            if (parts.length === 3) {
                                                const nameOfGeneric = parts[1];

                                                var newComponent = new Component(nameOfGeneric);

                                                for (let l = 0; l < children[j].children[k].children.length; ++l) {
                                                    if (children[j].children[k].children[l].name.includes("generic")) {
                                                        const parts = children[j].children[k].children[l].name.split("\'");
                                                        if (parts.length === 3) {
                                                            const nameOfGeneric = parts[1];
                                                            newComponent.addGeneric(nameOfGeneric);
                                                        }
                                                    }
                                                    //check if there are ports
                                                    else if (children[j].children[k].children[l].name.includes("port")) {
                                                        const parts = children[j].children[k].children[l].name.split("\'");
                                                        if (parts.length === 3) {
                                                            const nameOfGeneric = parts[1];
                                                            newComponent.addPort(nameOfGeneric);
                                                        }
                                                    }
                                                }


                                                newArch.addComponent(newComponent);
                                            }
                                        }
                                    }


                                    newEnt.addArchitecture(newArch);
                                }
                            }

                        }

                        //add the fully created entity to the Entity-Array
                        this.mEntities.push(newEnt);


                    }
                    //check if there are architecures
                    else if (documentSymbols[i].name.includes("architecture")) {
                        const parts = documentSymbols[i].name.split("\'");
                        if (parts.length === 3) {


                            const nameOfGeneric = parts[1];
                            archi.push(nameOfGeneric);

                            //here would be instances and components
                        }
                    }

                }
                //check if there are architecures
                else if (documentSymbols[i].name.includes("architecture")) {
                    const parts = documentSymbols[i].name.split("\'");
                    if (parts.length === 3) {


                        const nameOfGeneric = parts[1];
                        var newArch = new Architecture(nameOfGeneric);

                        //archi.push(nameOfGeneric);

                        //here would be instances and components
                        //check if there are components
                        for (let k = 0; k < documentSymbols[i].children.length; ++k) {
                            if (documentSymbols[i].children[k].name.includes("component")) {
                                const parts = documentSymbols[i].children[k].name.split("\'");
                                if (parts.length === 3) {
                                    const nameOfGeneric = parts[1];

                                    var newComponent = new Component(nameOfGeneric);

                                    for (let l = 0; l < documentSymbols[i].children[k].children.length; ++l) {
                                        if (documentSymbols[i].children[k].children[l].name.includes("generic")) {
                                            const parts = documentSymbols[i].children[k].children[l].name.split("\'");
                                            if (parts.length === 3) {
                                                const nameOfGeneric = parts[1];
                                                newComponent.addGeneric(nameOfGeneric);
                                            }
                                        }
                                        //check if there are ports
                                        else if (documentSymbols[i].children[k].children[l].name.includes("port")) {
                                            const parts = documentSymbols[i].children[k].children[l].name.split("\'");
                                            if (parts.length === 3) {
                                                const nameOfGeneric = parts[1];
                                                newComponent.addPort(nameOfGeneric);
                                            }
                                        }
                                    }


                                    newArch.addComponent(newComponent);
                                }
                            }
                        }

                        //add the fully created architecture to the Architecture-Array
                        this.mArch.push(newArch);
                    }
                }

                /*
                            for (let j = 0; j < documentSymbols[i].children.length; j++) {
                                //jedes Kind wird eingefügt
                                children.push(documentSymbols[i].children[j]);
                                if (children[j].name.includes("generic")) {
                                    const parts = children[j].name.split("\'");
                                    if (parts.length === 3) {
                                        const nameOfGeneric = parts[1];
                                        generics.push(nameOfGeneric);
                                    }
                                }
                                else if (children[j].name.includes("port")) {
                                    const parts = children[j].name.split("\'");
                                    if (parts.length === 3) {
                                        const nameOfGeneric = parts[1];
                                        ports.push(nameOfGeneric);
                                    }
                                }
                            }
                            //children[i] = documentSymbols[i].children;
                
                        }
                */

                //all entities + their children will be saved in this file
                // -> will be used to fill in the snippets
                const fileNameEntities = 'EntityInformation.json';
                const fileNameArchitec = 'ArchitecInformation.json';
                const dirPathOut = __dirname;
                const FolderBack = path.resolve(dirPathOut, '..', '..');
                const file = path.join(FolderBack, 'src', 'features', fileNameEntities);
                const fileArchi = path.join(FolderBack, 'src', 'features', fileNameArchitec);
                const jsonDataEntities = JSON.stringify(this.mEntities, null, 2);
                const jsonDataArchitectures = JSON.stringify(this.mArch, null, 2);

                fs.writeFileSync(file, jsonDataEntities);
                fs.writeFileSync(fileArchi, jsonDataArchitectures);

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
        }

        //this.ChangeSnippets(filePath);

        //this.updateSnippets();
    }

    public async ChangeSnippets() {
        const snippet = require('../../snippets/vhdl.json');
        console.log(snippet);

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const offset = editor.document.offsetAt(editor.selection.active);

            const position = new vscode.Position(
                editor.selection.active.line,
                editor.selection.active.character
            );

            // Snippet erstellen
            const snippetText = 'console.log("new Snip ack");';
            const snip = new vscode.SnippetString(snippetText);

            const snippetCompletionProvider: vscode.CompletionItemProvider<vscode.CompletionItem> = {
                provideCompletionItems(
                    document: vscode.TextDocument,
                    position: vscode.Position
                ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
                    const lineText = document.lineAt(position.line).text;
                    const currentWord = document.getText(document.getWordRangeAtPosition(position));

                    if (lineText.includes('Snipp') && currentWord === 'Snipp') {
                        const completionItem = new vscode.CompletionItem('My Snippet', vscode.CompletionItemKind.Snippet);
                        completionItem.insertText = new vscode.SnippetString(snippetText);
                        return [completionItem];
                    }

                    return [];
                }
            };

            this.mContext.subscriptions.push(
                vscode.languages.registerCompletionItemProvider('vhdl', snippetCompletionProvider, 'Snipp')
            );

            // Snippet-Completion-Provider registrieren
            /*this.mContext.subscriptions.push(
                vscode.languages.registerCompletionItemProvider('plaintext', {
                    provideCompletionItems(
                        document: vscode.TextDocument,
                        position: vscode.Position
                    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
                        const completionItem = new vscode.CompletionItem('My new Snippet', vscode.CompletionItemKind.Snippet);
                        completionItem.insertText = snip;
                        return [completionItem];
                    }
                })
            );*/
            console.log("servus");

        }
        /*  */
        /*
        const exampleSnippet = snippet['FSM example generate'];
        const names = ['World', 'John', 'Mary'];
        const options = '${2|' + names.join(',') + '|}';
        exampleSnippet.body[2] = exampleSnippet.body[2].
            replace(/\$\{2\|[^}]+\|\}/, options);
        //${2|rising_edge,falling_edge|}
 
        //"\tif ${2:${6|HILFE,Geh,Doch|}}($1) then",
 
        const snippetContent = JSON.stringify(snippet, null, 4);
 
        console.log(snippet);
 
 
        const dirPathOut = __dirname;
        const FolderBack = path.resolve(dirPathOut, '..', '..');
        const snippetfile = path.join(FolderBack, 'snippets', "vhdl.json");
 
        fs.writeFileSync(snippetfile, snippetContent);*/

        /*
                    fs.writeFile(snippetfile, snippetContent, 'utf-8', (err) => {
                        if (err) {
                            console.error('Fehler beim Schreiben der Snippet-Datei:', err);
                        } else {
                            // Aktualisiere die Snippets im Hintergrund
                            vscode.languages.getLanguages().then(languages => {
                                for (const language of languages) {
                                    if (vscode.extensions.getExtension(language) !== undefined) {
                                        vscode.languages.getSnippets(language).then(snippets => {
                                            if (snippets.length > 0) {
                                                vscode.languages.registerCodeActionsProvider(language, {
                                                    provideCodeActions: () => snippets.map(snippet => ({
                                                        title: 'Update Snippets',
                                                        command: {
                                                            title: 'Update Snippets',
                                                            command: 'editor.action.triggerSuggest'
                                                        }
                                                    }))
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });*/

        // Aktualisiere den Editor, um die Änderungen anzuwenden
        //vscode.commands.executeCommand('workbench.action.reloadWindow');

        const ret = vscode.commands.getCommands();
        console.log(ret);


        //funz nicht
        //vscode.commands.executeCommand('editor.action.triggerSuggest', snippetfile);
        //vscode.commands.executeCommand('editor.action.reloadSnippet', snippetfile);

        console.log("servus");
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
    }


    // Aktualisieren der Snippets in der laufenden VS Code-Instanz
    public async updateSnippets() {
        const snippJSON = require('../../snippets/vhdl.json');

        /*const newSnippStr = {
            'MeinSnippet': {
                'prefix': 'meinSnippet',
                'body': ['Mein neues Snippet'],
                'description': 'Ein neues Snippet'
            }
        };*/

        const dirPathOut = __dirname;
        const FolderBack = path.resolve(dirPathOut, '..', '..');
        const EntityJSON = path.join(FolderBack, 'src', 'features', './EntityInformation.json');

        if (this.checkFileExists(EntityJSON)) {

            const newSnipp: { [key: string]: any }[] = [];

            // JSON-Datei einlesen
            const entFileBuff = fs.readFileSync(EntityJSON, 'utf-8');
            const entJSONData = JSON.parse(entFileBuff);

            /*
            const entInstat = require(EntityJSON);
            const tomlLines = entFileBuff.split('\n');
                */

            // Iteriere über die Entitäten in der JSON-Datei
            entJSONData.forEach((entity: any) => {
                const entName = entity.name;
                const entPorts = entity.ports;
                const entGenerics = entity.generics;
                //const architectures = entity.architectures;

                //const exampleSnippet = snippJSON['Entityinstantiation'];
                /*const names = ['World', 'John', 'Mary'];
                const options = '${2|' + names.join(',') + '|}';
                exampleSnippet.body[2] = exampleSnippet.body[2].
                    replace(/\$\{2\|[^}]+\|\}/, options);*/
                //${2|rising_edge,falling_edge|}

                //"\tif ${2:${6|HILFE,Geh,Doch|}}($1) then",

                const portsAll = entPorts.join(' => ,\n\t\t') + " =>";
                const genAll = entGenerics.join(' => ,\n\t\t') + " =>";
                //const portsAll = portsAll+" =>";
                /*exampleSnippet.body[0] = exampleSnippet.body[0];//entity namen einfügen
                exampleSnippet.body[2] = exampleSnippet.body[2];//generics einfügen
                exampleSnippet.body[4] = exampleSnippet.body[4].
                    replace(/\$\{3:[^}]+\}/, portsAll);//ports einfügen*/

                const snipStr = "ei_" + entName;
                const newSnippStr = {
                    'EntityInstantiation': {
                        'prefix': snipStr,
                        'body': [
                            "DUT_" + entName + ": entity work." + entName,
                            "\tgeneric map(",
                            "\t\t" + genAll,
                            "\t)",
                            "\tport map(",
                            "\t\t" + portsAll,
                            "\t);",
                            "$0"
                        ],
                        'description': 'entity instantiation of ' + entName
                    }
                };

                //push the new 
                vscode.languages.registerCompletionItemProvider('vhdl', {
                    provideCompletionItems() {
                        const completionItems: vscode.CompletionItem[] = [];

                        for (const key in newSnippStr) {
                            if (newSnippStr.hasOwnProperty(key)) {
                                const snippet = newSnippStr[key];
                                const completionItem = new vscode.CompletionItem(snippet.prefix, vscode.CompletionItemKind.Snippet);
                                completionItem.insertText = new vscode.SnippetString(snippet.body.join('\n'));
                                completionItem.documentation = new vscode.MarkdownString(snippet.description);
                                completionItems.push(completionItem);
                            }
                        }

                        return completionItems;
                    }
                });


                console.log('servus');
            });


            /*
          fs.readFile(snippetpath, 'utf8', (err, data) => {
              if (err) {
                  console.error(err);
                  return;
              }
    
              const snippets = JSON.parse(data);
    */
            /*vscode.languages.registerCompletionItemProvider('vhdl', {
                provideCompletionItems() {
                    const completionItems: vscode.CompletionItem[] = [];

                    for (const key in newSnipp) {
                        if (newSnipp.hasOwnProperty(key)) {
                            const snippet = newSnipp[key];
                            const completionItem = new vscode.CompletionItem(snippet.prefix, vscode.CompletionItemKind.Snippet);
                            completionItem.insertText = new vscode.SnippetString(snippet.body.join('\n'));
                            completionItem.documentation = new vscode.MarkdownString(snippet.description);
                            completionItems.push(completionItem);
                        }
                    }

                    return completionItems;
                }
            });*/
            //});

            vscode.window.showInformationMessage('New entity instantiation Snippets made.');

        }
        else {
            vscode.window.showInformationMessage('No new Snippets made.');
        }
    }








    //--------------------------------------------
    //Private Methods
    //--------------------------------------------

    private SetCommand(): void {
        const commandId = 'VHDLbyHGB.reloadEntities';
        const defaultShortcut = 'Ctrl+Alt+S'; // Standardkombination

        if (vscode.workspace.workspaceFolders !== undefined) {
            const workspace = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const saveComamndHandler = vscode.commands.registerCommand(commandId, () =>
                this.updateSnippets(), this.GetOutput(workspace));

            this.mContext.subscriptions.push(saveComamndHandler);
        }
    }

    private checkFileExists(filePath: string): boolean {
        try {
            fs.accessSync(filePath, fs.constants.F_OK);
            return true;
        } catch (err) {
            return false;
        }
    }
}

/*
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension is now active!');

    const snippetText = 'console.log("new Snip ack");';
    const snip = new vscode.SnippetString(snippetText);

    const snippetCompletionProvider: vscode.CompletionItemProvider<vscode.CompletionItem> = {
        provideCompletionItems(
            document: vscode.TextDocument,
            position: vscode.Position
        ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
            const lineText = document.lineAt(position.line).text;
            const currentWord = document.getText(document.getWordRangeAtPosition(position));

            if (lineText.includes('Snipp') && currentWord === 'Snipp') {
                const completionItem = new vscode.CompletionItem('My Snippet', vscode.CompletionItemKind.Snippet);
                completionItem.insertText = snip;
                return [completionItem];
            }

            return [];
        }
    };

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider('vhdl', snippetCompletionProvider, 'Snipp')
    );
}*/