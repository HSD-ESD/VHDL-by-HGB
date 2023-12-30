import { SourceManager } from "../../../project/source_manager";
import * as vscode from 'vscode';
import * as path from 'path';
import { vhdl_ls } from "../../../lsp/vhdl_ls_package";

let _Context : vscode.ExtensionContext;

//provides the files for the tree view
export class ProjectViewProvider implements vscode.TreeDataProvider<ProjectItem>{
    
    private mWorkSpacePath : string;
    private mFileHolder : SourceManager;

    constructor(fileHolder : SourceManager, context : vscode.ExtensionContext, workspacePath : string){
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

            for(const [lib, libContents] of this.mFileHolder.GetProjectFiles()){

                const libraryItem : LibraryItem = new LibraryItem(lib, vscode.TreeItemCollapsibleState.Collapsed);
                if (libContents.is_third_party) {libraryItem.description = "third party";} 

                for(const file of libContents.files){
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
        projectSetup.tooltip = projectSetup.command.command;
        commands.push(projectSetup);

        const projectUpdate : CommandItem = new CommandItem("update project", vscode.TreeItemCollapsibleState.None);
        projectUpdate.command = {
            title: `update project`,
            command: 'VHDLbyHGB.Project.Update',
        };
        projectUpdate.tooltip = projectUpdate.command.command;
        commands.push(projectUpdate);

        return commands;
    }

    private create_VHDL_LS_Items() : ProjectItem[]
    {
        let VHDL_LS_Items : ProjectItem[] = [];

        // workspace-config
        const workspaceConfig : vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();

        // toml
        let vhdllsTomlItem : ProjectItem = new ProjectItem(vhdl_ls.VHDL_LS_FILE, vscode.TreeItemCollapsibleState.None);
        vhdllsTomlItem.iconPath = {
            light: _Context.asAbsolutePath(path.join('resources' , 'images', 'project', 'light', 'toml.svg')),
            dark: _Context.asAbsolutePath(path.join('resources' , 'images', 'project', 'dark',  'toml.svg'))
        };
        vhdllsTomlItem.tooltip = vhdl_ls.VHDL_LS_FILE;
        vhdllsTomlItem.description = workspaceConfig.get("vhdl-by-hgb.vhdlls.toml.generation");
        vhdllsTomlItem.resourceUri = vscode.Uri.file(path.join(this.mWorkSpacePath, vhdl_ls.VHDL_LS_FILE));
        vhdllsTomlItem.command = {
            title: `Open ${vhdl_ls.VHDL_LS_FILE}`,
            command: 'vscode.open',
            arguments: [vhdllsTomlItem.resourceUri],
        };
        VHDL_LS_Items.push(vhdllsTomlItem);

        // commands
        let commandsItem : ProjectItem = new ProjectItem("commands", vscode.TreeItemCollapsibleState.Collapsed);
        commandsItem.iconPath = {
            light: _Context.asAbsolutePath(path.join('resources', 'images', 'general', 'light', 'commands.svg')),
            dark: _Context.asAbsolutePath(path.join('resources', 'images', 'general', 'dark', 'commands.svg'))
        };

            const VHDL_LS_restart : CommandItem = new CommandItem("VHDL_LS: restart", vscode.TreeItemCollapsibleState.None);
            VHDL_LS_restart.command = {
                title: 'VHDL_LS: restart',
                command: 'VHDLbyHGB.vhdlls.restart',
            };
            VHDL_LS_restart.tooltip = VHDL_LS_restart.command.command;
            commandsItem.children.push(VHDL_LS_restart);

            const VHDL_LS_activate : CommandItem = new CommandItem("VHDL_LS: activate", vscode.TreeItemCollapsibleState.None);
            VHDL_LS_activate.command = {
                title: 'VHDL_LS: activate',
                command: 'VHDLbyHGB.vhdlls.activate',
            };
            VHDL_LS_activate.tooltip = VHDL_LS_activate.command.command;
            commandsItem.children.push(VHDL_LS_activate);

            const VHDL_LS_deactivate : CommandItem = new CommandItem("VHDL_LS: deactivate", vscode.TreeItemCollapsibleState.None);
            VHDL_LS_deactivate.command = {
                title: 'VHDL_LS: deactivate',
                command: 'VHDLbyHGB.vhdlls.deactivate',
            };
            VHDL_LS_deactivate.tooltip =VHDL_LS_deactivate.command.command; 
            commandsItem.children.push(VHDL_LS_deactivate);

        VHDL_LS_Items.push(commandsItem);

        // config
        let configItem : ProjectItem = new ProjectItem("configuration", vscode.TreeItemCollapsibleState.Collapsed);
        configItem.iconPath = {
            light: _Context.asAbsolutePath(path.join('resources', 'images', 'general', 'light', 'settings.svg')),
            dark: _Context.asAbsolutePath(path.join('resources', 'images', 'general', 'dark',  'settings.svg'))
        };

            const VHDL_LS_location : ConfigItem = new ConfigItem(workspaceConfig.get('vhdl-by-hgb.vhdlls.languageServer')!, vscode.TreeItemCollapsibleState.None);
            VHDL_LS_location.description = "location";
            configItem.children.push(VHDL_LS_location);

            const VHDL_LS_user_path : ConfigItem = new ConfigItem(workspaceConfig.get('vhdl-by-hgb.vhdlls.languageServerUserPath')!, vscode.TreeItemCollapsibleState.None);
            VHDL_LS_user_path.description = "user path";
            configItem.children.push(VHDL_LS_user_path);

            const VHDL_LS_trace : ConfigItem = new ConfigItem(workspaceConfig.get('vhdl-by-hgb.vhdlls.trace.server')!, vscode.TreeItemCollapsibleState.None);
            VHDL_LS_trace.description = "trace";
            configItem.children.push(VHDL_LS_trace);

        VHDL_LS_Items.push(configItem);
        
        return VHDL_LS_Items;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void > =
    new vscode.EventEmitter <FileItem | undefined | null | void >();

    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void{
        this._onDidChangeTreeData.fire();
    }
}


export class ProjectItem extends vscode.TreeItem{

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

class ConfigItem extends ProjectItem{
    constructor(
        public readonly commandName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState
    )
    {
        super(commandName, collapsibleState);
    }
    
    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources' , 'images', 'general', 'light', 'setting.svg')),
        dark: _Context.asAbsolutePath(path.join('resources' , 'images', 'general', 'dark',  'setting.svg'))
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