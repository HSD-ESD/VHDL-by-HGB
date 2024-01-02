// general imports
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// specific imports
import { vhdl_ls } from '../../lsp/vhdl_ls_package';

// module-internal constants
const CONFIG_KEY = 'VHDLbyHGB.snippets';

//class for all entities
class Entity {
    private name: string;
    private ports: string[];
    private generics: string[];

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

    getName() {
        return this.name;
    }

    getPort() {
        return this.ports;
    }

    getGenerics() {
        return this.generics;
    }

    serialize(): any {
        return {
            name: this.name,
            ports: this.ports,
            generics: this.generics
        };
    }

    static deserialize(serializedEntity: any): Entity {
        const entity = new Entity(serializedEntity.name);
        entity.ports = serializedEntity.ports;
        entity.generics = serializedEntity.generics;
        return entity;
    }
}

export class DynamicSnippets {
    //--------------------------------------------
    //Private Members
    //--------------------------------------------
    private mContext: vscode.ExtensionContext;

    private mEntities: Entity[] = [];

    private myCompletionItemProvider: vscode.Disposable | undefined;

    //--------------------------------------------
    //Public Methods
    //--------------------------------------------

    public constructor(context: vscode.ExtensionContext) {
        this.mContext = context;

        this.SetCommand();
    }

    /*
     * This function gets the output from the LS Trace for
     * all files in the toml-file and saves the entities
     * with their ports and generics to make the snippets
     */
    public async GetOutput(filePath: string) {

        //update all files
        //vscode.commands.executeCommand("VHDLbyHGB.ProjectManager.UpdateFiles");

        //get the toml file and get als vhdl files
        const tomlPath = path.join(filePath, vhdl_ls.VHDL_LS_FILE);
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

        //go through all toml entries
        for (let idx = 0; idx < tomlFiles.length; idx++) {

            const newPath: string = path.join(filePath, tomlFiles[idx]);

            //gets output trace from the LanguageServer from all toml-File entries
            var documentSymbols: vscode.DocumentSymbol[] =
                await vscode.commands.executeCommand
                    <vscode.DocumentSymbol[]>
                    ('vscode.executeDocumentSymbolProvider',
                        vscode.Uri.file(newPath));

            //if the LS hasn't given an Output -> wait
            while (documentSymbols === undefined) {
                documentSymbols =
                    await vscode.commands.executeCommand
                        <vscode.DocumentSymbol[]>
                        ('vscode.executeDocumentSymbolProvider',
                            vscode.Uri.file(newPath));
            }

            var children: vscode.DocumentSymbol[] = new Array();

            for (let i = 0; i < documentSymbols.length; i++) {
                if (documentSymbols[i].name.includes("entity")) {
                    const parts = documentSymbols[i].name.split("\'");
                    if (parts.length === 3) {
                        const nameOfEnt = parts[1];

                        //check if the entitiy does already exist in the array -> 
                        const existingEnt = this.mEntities.find(elem => elem.getName() === nameOfEnt);
                        var newEnt;

                        //remove the existing entity and write it anew
                        if (existingEnt) {
                            const indexToRemove = this.mEntities.indexOf(existingEnt);
                            if (indexToRemove !== -1) {
                                this.mEntities.splice(indexToRemove, 1);
                            }
                        }

                        newEnt = new Entity(nameOfEnt);

                        //get everything of the entity
                        for (let j = 0; j < documentSymbols[i].children.length; j++) {
                            //all children will be pushed
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
                                    const nameOfPort = parts[1];
                                    newEnt.addPort(nameOfPort);
                                }
                            }
                        }

                        //add the fully created entity to the Entity-Array
                        this.mEntities.push(newEnt);

                    }
                }
            }
        }

        this.updateSnippets();
    }

    //--------------------------------------------
    //Private Methods
    //--------------------------------------------

    /*
     * This function makes the dynamic entity instantiations from the
     * entity information in mEntities
     */
    private async updateSnippets() {
        const mySnippets: vscode.CompletionItem[] = [];

        if(this.mEntities.length !== 0){
            this.mEntities.forEach((entity: any) => {
                const portsAll = entity.ports.join(' => ,\n\t\t') + " =>";
                const genAll = entity.generics.join(' => ,\n\t\t') + " =>";

                const snipStr = "entity " +  entity.name + " - instantiation";

                var newSnippStr;
                //ports and generics exist
                if (entity.ports.length !== 0 && entity.generics.length !== 0) {
                    newSnippStr = {
                        'EntityInstantiation': {
                            'prefix': snipStr,
                            'body': [
                                entity.name + "_inst" + ": entity ${1:work}." + entity.name,
                                "\tgeneric map(",
                                "\t\t" + genAll,
                                "\t)",
                                "\tport map(",
                                "\t\t" + portsAll,
                                "\t);",
                                "$0"
                            ],
                            'description': "entity instantiation of " + entity.name
                        }
                    };
                }
                //only generics exist
                else if (entity.ports.length === 0 && entity.generics.length !== 0) {
                    newSnippStr = {
                        'EntityInstantiation': {
                            'prefix': snipStr,
                            'body': [
                                entity.name + "_inst" + ": entity ${1:work}." + entity.name,
                                "\tgeneric map(",
                                "\t\t" + genAll,
                                "\t);",
                                "$0"
                            ],
                            'description': "entity instantiation of " + entity.name
                        }
                    };
                }
                //only ports exist
                else {
                    newSnippStr = {
                        'EntityInstantiation': {
                            'prefix': snipStr,
                            'body': [
                                entity.name + "_inst" + ": entity ${1:work}." + entity.name,
                                "\tport map(",
                                "\t\t" + portsAll,
                                "\t);",
                                "$0"
                            ],
                            'description': "entity instantiation of " + entity.name
                        }
                    };
                }

                //checking snippets -> replace or make them
                const config = vscode.workspace.getConfiguration();
                const snippetsConfig = config.get(CONFIG_KEY, {});

                for (const key in newSnippStr) {
                    if (newSnippStr.hasOwnProperty(key)) {
                        const snippet = newSnippStr[key];
                        const snippetName = snippet.prefix;


                        //check if the name of the snippet exists
                        if (snippetsConfig.hasOwnProperty(snippetName)) {
                            //it does -> use new information
                            continue;
                        }

                        //make new snippet for the configuation
                        const completionItem = new vscode.CompletionItem(snippet.prefix, vscode.CompletionItemKind.Snippet);
                        completionItem.insertText = new vscode.SnippetString(snippet.body.join('\n'));
                        completionItem.documentation = new vscode.MarkdownString(snippet.description);
                        mySnippets.push(completionItem);
                        //save the name of the snippet in the config
                        snippetsConfig[snippetName] = true;
                    }
                }
            });


            if(this.myCompletionItemProvider){
                // register provider new for changes
                this.myCompletionItemProvider.dispose();
                }

                // register current Provider
                this.myCompletionItemProvider = vscode.languages.registerCompletionItemProvider(
                    'vhdl',
                    {
                    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                        return mySnippets;
                    },
                    }
                );

            vscode.window.showInformationMessage('New entity instantiation Snippets made.');

        }
        else {
            vscode.window.showInformationMessage('No new Snippets made.');
        }

    }

    private SetCommand(): void {
        const commandId = "VHDLbyHGB.dynamicSnippets";

        if (vscode.workspace.workspaceFolders !== undefined) {
            const workspace = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const saveCommandHandler = vscode.commands.registerCommand(commandId, () => {
                this.GetOutput(workspace);
            });

            this.mContext.subscriptions.push(saveCommandHandler);
        }
    }
}