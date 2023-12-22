import { FileHolder } from "../../FileTools/FileHolder";
import * as vscode from 'vscode';
import * as path from 'path';

let _Context : vscode.ExtensionContext;

//provides the files for the tree view
export class ProjectViewProvider implements vscode.TreeDataProvider<ProjectItem>{
    
    private mWorkSpacePath : string;
    private mFileHolder : FileHolder;

    constructor(fileHolder : FileHolder, context : vscode.ExtensionContext, workspacePath : string){
        this.mWorkSpacePath = workspacePath;
        _Context = context;
        this.mFileHolder = fileHolder;
    }

    getTreeItem(element: ProjectItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ProjectItem): vscode.ProviderResult<ProjectItem[]> 
    {
        if(element){
            return element.children;
        }
        else{
            return this.fillRoots();
        }
    }

    private fillRoots(): ProjectItem[]
    {
        let projectItems : ProjectItem[] = [];

        // VHDL LS
        let VHDL_LS_item : ProjectItem = new ProjectItem("VHDL_LS", vscode.TreeItemCollapsibleState.Collapsed);
        VHDL_LS_item.iconPath = {
            light: _Context.asAbsolutePath(path.join('resources', 'images', 'project', 'light', 'server-environment.svg')),
            dark: _Context.asAbsolutePath(path.join('resources' , 'images', 'project', 'dark',  'server-environment.svg'))
        };
        VHDL_LS_item.children = this.create_VHDL_LS_Items();
        projectItems.push(VHDL_LS_item);
        
        // commands
        let commandsItem : ProjectItem = new ProjectItem("commands", vscode.TreeItemCollapsibleState.Collapsed);
        commandsItem.iconPath = {
            light: _Context.asAbsolutePath(path.join('resources' , 'images', 'general', 'light', 'commands.svg')),
            dark: _Context.asAbsolutePath(path.join('resources' , 'images', 'general', 'dark',  'commands.svg'))
        };
        commandsItem.children = this.createCommandItems();
        projectItems.push(commandsItem);

        // lib
        let libraryOverviewItem : ProjectItem = new ProjectItem("libraries", vscode.TreeItemCollapsibleState.Collapsed);
        libraryOverviewItem.children = this.createLibraryItems();
        libraryOverviewItem.iconPath = {
            light: _Context.asAbsolutePath(path.join('resources' , 'images', 'project', 'light', 'folder-library.svg')),
            dark: _Context.asAbsolutePath(path.join('resources' , 'images', 'project', 'dark',  'folder-library.svg'))
        };
        projectItems.push(libraryOverviewItem);


        return projectItems;
    }

    private createLibraryItems() : ProjectItem[]
    {
        let libraries : LibraryItem[] = [];

        //check if projectfiles are not empty
        if(this.mFileHolder.GetProjectFiles().size !== 0){

            for(const [lib, files] of this.mFileHolder.GetProjectFiles()){

                const libraryItem : LibraryItem = new LibraryItem(lib, vscode.TreeItemCollapsibleState.Collapsed);

                for(const file of files){
                    const fileItem : FileItem = new FileItem(path.relative(this.mWorkSpacePath,file), vscode.TreeItemCollapsibleState.None);
                    fileItem.resourceUri = vscode.Uri.file(file);
                    fileItem.command = {
                        title: `open ${fileItem.tooltip}`,
                        command: 'vscode.open',
                        arguments: [fileItem.resourceUri],
                    };
                    libraryItem.children.push(fileItem);
                }

                libraries.push(libraryItem);
            }

            return libraries;
        }
        else{
            //return an empty array if there are no files
            return [];
        }
    }

    private createCommandItems() : ProjectItem[]
    {
        let commands : CommandItem[] = [];

        const projectSetup : CommandItem = new CommandItem("setup project", vscode.TreeItemCollapsibleState.None);
        projectSetup.command = {
            title: `setup project`,
            command: 'VHDLbyHGB.Project.Setup',
        };
        commands.push(projectSetup);

        const projectUpdate : CommandItem = new CommandItem("update project", vscode.TreeItemCollapsibleState.None);
        projectSetup.command = {
            title: `update project`,
            command: 'VHDLbyHGB.Project.Update',
        };
        commands.push(projectUpdate);

        return commands;
    }

    private create_VHDL_LS_Items() : ProjectItem[]
    {
        let VHDL_LS_Items : ProjectItem[] = [];

        // toml
        let vhdllsTomlItem : ProjectItem = new ProjectItem("vhdl_ls.toml", vscode.TreeItemCollapsibleState.None);
        vhdllsTomlItem.iconPath = {
            light: _Context.asAbsolutePath(path.join('resources' , 'images', 'project', 'light', 'toml.svg')),
            dark: _Context.asAbsolutePath(path.join('resources' , 'images', 'project', 'dark',  'toml.svg'))
        };
        vhdllsTomlItem.resourceUri = vscode.Uri.file(path.join(this.mWorkSpacePath, "vhdl_ls.toml"));
        vhdllsTomlItem.command = {
            title: 'Open vhdl_ls.toml',
            command: 'vscode.open',
            arguments: [vhdllsTomlItem.resourceUri],
        };
        VHDL_LS_Items.push(vhdllsTomlItem);

        // commands
        let commandsItem : ProjectItem = new ProjectItem("commands", vscode.TreeItemCollapsibleState.Collapsed);
        commandsItem.iconPath = {
            light: _Context.asAbsolutePath(path.join('resources' , 'images', 'general', 'light', 'commands.svg')),
            dark: _Context.asAbsolutePath(path.join('resources' , 'images', 'general', 'dark',  'commands.svg'))
        };

            const VHDL_LS_restart : CommandItem = new CommandItem("VHDL_LS: restart", vscode.TreeItemCollapsibleState.None);
            VHDL_LS_restart.command = {
                title: 'VHDL_LS: restart',
                command: 'VHDLbyHGB.vhdlls.restart',
            };
            commandsItem.children.push(VHDL_LS_restart);

            const VHDL_LS_activate : CommandItem = new CommandItem("VHDL_LS: activate", vscode.TreeItemCollapsibleState.None);
            VHDL_LS_activate.command = {
                title: 'VHDL_LS: activate',
                command: 'VHDLbyHGB.vhdlls.activate',
            };
            commandsItem.children.push(VHDL_LS_activate);

            const VHDL_LS_deactivate : CommandItem = new CommandItem("VHDL_LS: deactivate", vscode.TreeItemCollapsibleState.None);
            VHDL_LS_deactivate.command = {
                title: 'VHDL_LS: deactivate',
                command: 'VHDLbyHGB.vhdlls.deactivate',
            };
            commandsItem.children.push(VHDL_LS_deactivate);

        VHDL_LS_Items.push(commandsItem);
        
        return VHDL_LS_Items;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void > =
    new vscode.EventEmitter <FileItem | undefined | null | void >();

    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void{
        this._onDidChangeTreeData.fire();
    }
}


class ProjectItem extends vscode.TreeItem{

    public children : ProjectItem[] = [];

    constructor(
        public readonly itemName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(itemName, collapsibleState);
    }
}

class FileItem extends ProjectItem{
    constructor(
        public readonly fileName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState
    )
    {
        super(fileName, collapsibleState);
    }
    
    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources' , 'images', 'project', 'light', 'file.svg')),
        dark: _Context.asAbsolutePath(path.join('resources' , 'images', 'project', 'dark',  'file.svg'))
    };

    tooltip = path.basename(this.fileName);
}

class LibraryItem extends ProjectItem{
    constructor(
        public readonly libraryName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState
    )
    {
        super(libraryName, collapsibleState);
    }
    
    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources' , 'images', 'project', 'light', 'library.svg')),
        dark: _Context.asAbsolutePath(path.join('resources' , 'images', 'project', 'dark',  'library.svg'))
    };
}

class CommandItem extends ProjectItem{
    constructor(
        public readonly commandName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState
    )
    {
        super(commandName, collapsibleState);
    }
    
    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources' , 'images', 'general', 'light', 'command.svg')),
        dark: _Context.asAbsolutePath(path.join('resources' , 'images', 'general', 'dark',  'command.svg'))
    };
}

class Folder extends vscode.TreeItem{

    constructor(
        public readonly folderName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState
    )
    {
        super(folderName, collapsibleState);
    }
}