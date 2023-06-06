//--------------------------------------------
//general imports
//--------------------------------------------
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FileSysWatcher } from '../FileSystemWatcher';
import { Disposable } from 'vscode-languageclient';

const CONFIG_KEY = 'VHDLbyHGB.snippets';

//class for all entities
class Entity {
    private name: string;
    private ports: string[];
    private generics: string[];
    //private architectures: Architecture[];

    constructor(name: string) {
        this.name = name;
        this.ports = [];
        this.generics = [];
        //this.architectures = [];
    }

    addPort(port: string) {
        this.ports.push(port);
    }

    addGeneric(generic: string) {
        this.generics.push(generic);
    }

    /*addArchitecture(architecture: Architecture) {
        this.architectures.push(architecture);
    }*/

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

interface RegisteredSnippet extends vscode.Disposable {
    name: string;
}

export class DynamicSnippets {
    //--------------------------------------------
    //Private Members
    //--------------------------------------------
    private mContext: vscode.ExtensionContext;

    private mEntities: Entity[] = [];

    private mArch: Architecture[] = [];

    private mTomlWatcher: any;

    //--------------------------------------------
    //Public Methods
    //--------------------------------------------

    public constructor(context: vscode.ExtensionContext) {
        this.mContext = context;
        //vscode.workspace.createFileSystemWatcher
        this.SetCommand();
        //const sysWatcher = new FileSysWatcher(this.mContext);
        this.mTomlWatcher = new FileSysWatcher(this.mContext).getTomlWatcher();

        //this.mEntities = new Array();
        //this.mEntities = this.restoreState();
    }

    /*
     * Diese Funktion legt den gesamten Output des Traces auf  
     * eine File, welche dann ausgewertet werden kann und zu den 
     * Snippets hinzugefügt wird
     */
    public async GetOutput(filePath: string) {

        //update all files
        //vscode.commands.executeCommand("VHDLbyHGB.ProjectManager.UpdateFiles");

        var previousContent: string | undefined;

        /*
        this.mTomlWatcher.onDidChange((e: vscode.Uri) => {
            const currentContent = fs.readFileSync(e.fsPath, 'utf8');
            if (previousContent !== undefined) {
                const diff = this.mTomlWatcher.compareContents(previousContent, currentContent);
                console.log(`Änderungen in ${e.fsPath}:`);
                console.log(diff);
            }
            previousContent = currentContent;
        });*/

        //get the toml file and get als vhdl files
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
            while (documentSymbols == undefined) {
                documentSymbols =
                    await vscode.commands.executeCommand
                        <vscode.DocumentSymbol[]>
                        ('vscode.executeDocumentSymbolProvider',
                            vscode.Uri.file(newPath));
            }

            //var archi: string[] = new Array();

            var children: vscode.DocumentSymbol[] = new Array();

            //var port: string[] = new Array();
            //var generic: string[] = new Array();

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
                            //check if there are architecures
                            /*
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
                            }*/

                        }

                        //add the fully created entity to the Entity-Array
                        this.mEntities.push(newEnt);


                    }
                    //check if there are architecures
                    /*
                    else if (documentSymbols[i].name.includes("architecture")) {
                        const parts = documentSymbols[i].name.split("\'");
                        if (parts.length === 3) {


                            const nameOfGeneric = parts[1];
                            archi.push(nameOfGeneric);

                            //here would be instances and components
                        }
                    }
                    */

                }
                //check if there are architecures
                /*else if (documentSymbols[i].name.includes("architecture")) {
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
                }*/


                /*
                //all entities + their children will be saved in this file
                // -> will be used to fill in the snippets
                const fileNameEntities = 'EntityInformation.json';
                //const fileNameArchitec = 'ArchitecInformation.json';
                const dirPathOut = __dirname;
                const FolderBack = path.resolve(dirPathOut, '..', '..');
                const file = path.join(FolderBack, 'src', 'features', 'DynamicSnippets', fileNameEntities);
                //const fileArchi = path.join(FolderBack, 'src', 'features', fileNameArchitec);
                const jsonDataEntities = JSON.stringify(this.mEntities, null, 2);
                //const jsonDataArchitectures = JSON.stringify(this.mArch, null, 2);

                fs.writeFileSync(file, jsonDataEntities);*/
                //fs.writeFileSync(fileArchi, jsonDataArchitectures);
            }
        }

        this.saveState();

        this.updateSnippets();
        //const serializedArray = this.mEntities.map(item => item.serialize());
        //vscode.workspace.getConfiguration().update('VHDLbyHGB.EntitySave', serializedArray, true);
    }



    public async saveState() {
        // Füge einen Listener hinzu, um den Wert der Variable zu aktualisieren
        vscode.workspace.onDidChangeConfiguration(() => {
            // Lese die Konfiguration und setze den Wert der Variable
            const config = vscode.workspace.getConfiguration('VHDLbyHGB');
            //this.mEntities = config.get('mEntities');
            // Speichere den Wert im globalen Speicher
            this.mContext.globalState.update('mEntities', this.mEntities);
        });
        /*
        const serializedArray = this.mEntities.map(item => item.serialize());
        vscode.workspace.getConfiguration().update('VHDLbyHGB.EntitySave', serializedArray, false);
        */
    }

    private async restoreState() {
        const serializedArray = vscode.workspace.getConfiguration().get('VHDLbyHGB.EntitySave') as any[];
        if (serializedArray) {
            return serializedArray.map(serializedItem => Entity.deserialize(serializedItem));
        }
        return [];
    }
    private registeredSnippets: RegisteredSnippet[] = [];

    //--------------------------------------------
    //Private Methods
    //--------------------------------------------
    // this func makes and updates dynamic entity instantiations
    private async updateSnippets() {
        /*
        for (let i = 0; i < this.mEntities.length; i++) {
            const entName = this.mEntities[i].getName();
            const port = this.mEntities[i].getPort();
            const generic = this.mEntities[i].getGenerics();

            var strPorts : string = "";
            for (let j = 0; j < port.length; j++) {
                if (j === port.length - 1) {
                    strPorts += port[j] + ' => ';
                }
                else {
                    strPorts += port[j] + ' => ,\n\t\t';
                }
            }

            var strGen : string = "";
            for (let j = 0; j < generic.length; j++) {
                if (j === generic.length - 1) {
                    strGen += generic[j] + ' => ';
                }
                else {
                    strGen += generic[j] + ' => ,\n\t\t';
                }
            }

            const snipStr = "ei_" + entName;
            const entPorts = strPorts;
            const entGens = strGen;

            var newSnippStr;
            if (generic.length !== 0) {
                newSnippStr = {
                    'EntityInstantiation': {
                        'prefix': snipStr,
                        'body': [
                            "DUT_" + entName + ": entity work." + entName,
                            "\tgeneric map(",
                            "\t\t" + strGen,
                            "\t)",
                            "\tport map(",
                            "\t\t" + strPorts,
                            "\t);",
                            "$0"
                        ],
                        'description': 'entity instantiation of ' + entName
                    }
                };
            }
            else {
                newSnippStr = {
                    'EntityInstantiation': {
                        'prefix': snipStr,
                        'body': [
                            "DUT_" + entName + ": entity work." + entName,
                            "\tport map(",
                            "\t\t" + strPorts,
                            "\t);",
                            "$0"
                        ],
                        'description': "entity instantiation of " + entName
                    }
                };
            }

            //push the new snippet
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
        }
        vscode.window.showInformationMessage('New entity instantiation Snippets made.');
*/


        const dirPathOut = __dirname;
        const FolderBack = path.resolve(dirPathOut, '..', '..', '..');
        const EntityJSON = path.join(FolderBack, 'src', 'features', 'DynamicSnippets', './EntityInformation.json');

        if (this.checkFileExists(EntityJSON)) {
            // reading JSON-File
            const entFileBuff = fs.readFileSync(EntityJSON, 'utf-8');
            const entJSONData = JSON.parse(entFileBuff);

            // go over all entities
            entJSONData.forEach((entity: any) => {
                const entName = entity.name;
                const entPorts = entity.ports;
                const entGenerics = entity.generics;

                const portsAll = entPorts.join(' => ,\n\t\t') + " =>";
                const genAll = entGenerics.join(' => ,\n\t\t') + " =>";

                const snipStr = "ei_" + entName;

                var newSnippStr;
                if (entGenerics.length !== 0) {
                    newSnippStr = {
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
                            'description': "entity instantiation of " + entName
                        }
                    };
                }
                else {
                    newSnippStr = {
                        'EntityInstantiation': {
                            'prefix': snipStr,
                            'body': [
                                "DUT_" + entName + ": entity work." + entName,
                                "\tport map(",
                                "\t\t" + portsAll,
                                "\t);",
                                "$0"
                            ],
                            'description': "entity instantiation of " + entName
                        }
                    };
                }

                // Überprüfe, ob der Name des Snippets bereits existiert
                /*if (this.registeredSnippets.includes(snipStr)) {
                    // Snippet existiert bereits, lösche es
                    const snippetIndex = this.registeredSnippets.indexOf(snipStr);
                    this.registeredSnippets.splice(snippetIndex, 1);
                }*/
                // Füge das neue Snippet hinzu
                //this.registeredSnippets.push(snipStr);

                const foundDisposable = this.registeredSnippets.find(
                    (disposable) => disposable.name === snipStr
                );


                //push the new snippet
                const provider = vscode.languages.registerCompletionItemProvider('vhdl', {
                    provideCompletionItems() {
                        const completionItems: vscode.CompletionItem[] = [];
                        // Überprüfe, ob die Snippets bereits in den Einstellungen gespeichert wurden
                        const config = vscode.workspace.getConfiguration();
                        const snippetsConfig = config.get(CONFIG_KEY, {});

                        for (const key in newSnippStr) {
                            if (newSnippStr.hasOwnProperty(key)) {
                                const snippet = newSnippStr[key];
                                const snippetName = snippet.prefix;


                                // Überprüfe, ob der Name des Snippets bereits existiert
                                if (snippetsConfig.hasOwnProperty(snippetName)) {
                                    // Snippet existiert bereits, überspringe es oder handle es entsprechend
                                    continue;
                                }
                                const completionItem = new vscode.CompletionItem(snippet.prefix, vscode.CompletionItemKind.Snippet);
                                completionItem.insertText = new vscode.SnippetString(snippet.body.join('\n'));
                                completionItem.documentation = new vscode.MarkdownString(snippet.description);
                                completionItems.push(completionItem);
                                // Speichere den Namen des Snippets in den Einstellungen
                                snippetsConfig[snippetName] = true;
                            }
                        }

                        return completionItems;
                    }
                });

                // Füge das neue Snippet hinzu
                //this.registeredSnippets.push(snipStr);
            });
            vscode.window.showInformationMessage('New entity instantiation Snippets made.');

        }
        else {
            vscode.window.showInformationMessage('No new Snippets made.');
        }

    }

    private SetCommand(): void {
        const commandId = 'VHDLbyHGB.reloadEntities';
        const defaultShortcut = 'Ctrl+Alt+S'; // Standardkombination

        if (vscode.workspace.workspaceFolders !== undefined) {
            const workspace = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const saveComamndHandler = vscode.commands.registerCommand(commandId, () => {
                //this.restoreState();
                this.GetOutput(workspace);
                //this.updateSnippets();
            });

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