// general imports
import * as vscode from 'vscode';
import * as path from 'path';

// specific imports
import { ISynthesisProject  } from '../../../hdl_tools/synthesis/synthesis_project';
import { SynthesisGraphicsMap, eSynthesisTool } from '../../../hdl_tools/synthesis/synthesis_package';

// types
export enum eSynthesisViewItemContextValue {
    synthesisTool = "synthesisTool",
    synthesisProject = "synthesisProject",
    synthesisTopLevel = "synthesisTopLevel",
    synthesisDevice = "synthesisDevice",
    synthesisFamily = "synthesisFamily",
    synthesisFiles = "synthesisFiles",
    synthesisFile = "synthesisFile"
}

// variables
let _Context : vscode.ExtensionContext;
let _workspacePath : string;

export class SynthesisViewProvider implements vscode.TreeDataProvider<SynthesisItem>{

    private mSynthesisProjects : Map<eSynthesisTool, Array<ISynthesisProject>>;

    constructor(synthesisProjects : Map<eSynthesisTool, Array<ISynthesisProject>>, context : vscode.ExtensionContext, workspacePath : string) {
        this.mSynthesisProjects = synthesisProjects;
        _workspacePath = workspacePath;
        _Context = context;
    }

    getTreeItem(element: SynthesisItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element: SynthesisTool): vscode.ProviderResult<SynthesisItem[]> {

        if(element){
            return element.children;
        }
        else{
            return this.fillRoots(element);
        }
    }

    private fillRoots(synthesisItem : SynthesisItem) : SynthesisItem[]
    {
        let tools : SynthesisTool[] = [];

        for(const [synthesisTool, synthesisProjects] of this.mSynthesisProjects)
        {
            const tool : SynthesisTool = new SynthesisTool(synthesisTool, vscode.TreeItemCollapsibleState.Collapsed);

            for (const synthesisProject of synthesisProjects)
            {   
                if (!synthesisProjects)
                {
                    continue;
                }

                const project : SynthesisProject = new SynthesisProject(synthesisProject, vscode.TreeItemCollapsibleState.Collapsed, synthesisProject.GetName());
                project.resourceUri = vscode.Uri.file(synthesisProject.GetPath());
                project.command = {
                    title: `open ${project.tooltip}`,
                    command: 'vscode.open',
                    arguments: [project.resourceUri],
                };

                project.children.push(new SynthesisTopLevel(synthesisProject.GetTopLevel().mName, vscode.TreeItemCollapsibleState.None));
                project.children.push(new SynthesisDevice (synthesisProject.GetDevice() , vscode.TreeItemCollapsibleState.None));
                project.children.push( new SynthesisFamily(synthesisProject.GetFamily(), vscode.TreeItemCollapsibleState.None));
                let synthesisFiles : SynthesisFiles = new SynthesisFiles("files", vscode.TreeItemCollapsibleState.Collapsed);
                
                for (const currentFile of synthesisProject.GetFiles())
                {
                    let synthesisFile : SynthesisFile = new SynthesisFile(currentFile, vscode.TreeItemCollapsibleState.None);
                    const synthesisProjectPath = path.resolve(synthesisProject.GetPath(), currentFile);
                    synthesisFile.resourceUri = vscode.Uri.file(synthesisProjectPath);
                    synthesisFile.command = {
                        title: `open ${synthesisFile.tooltip}`,
                        command: 'vscode.open',
                        arguments: [synthesisFile.resourceUri],
                    };
                    synthesisFiles.children.push(synthesisFile);
                }

                project.children.push(synthesisFiles);
                
                tool.children.push(project);
            }

            tools.push(tool);
        }    
              
        return tools;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<SynthesisTool | undefined | null | void > =
    new vscode.EventEmitter <SynthesisTool | undefined | null | void >();

    readonly onDidChangeTreeData: vscode.Event<SynthesisTool | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void{
        this._onDidChangeTreeData.fire();
    }
}

export class SynthesisItem extends vscode.TreeItem{

    public children : SynthesisItem[] = [];

    constructor(
        public readonly SynthesisToolName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisToolName, collapsibleState);
    }
}

class SynthesisTool extends SynthesisItem{

    constructor(
        public readonly synthesisTool : eSynthesisTool,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(synthesisTool.valueOf(), collapsibleState);
    }

    contextValue = eSynthesisViewItemContextValue.synthesisTool;

    iconPath = {
        light: _Context.asAbsolutePath(SynthesisGraphicsMap.get(this.synthesisTool)!),
        dark: _Context.asAbsolutePath(SynthesisGraphicsMap.get(this.synthesisTool)!)
    };
}

class SynthesisProject extends SynthesisItem{

    constructor(
        public readonly synthesisProject : ISynthesisProject,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
        public readonly projectName : string
    ) {
        super(path.relative(_workspacePath, synthesisProject.GetPath()), collapsibleState);
    }

    tooltip = this.projectName;

    contextValue = eSynthesisViewItemContextValue.synthesisProject;

    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources', 'images','synthesis' , 'light', 'project.svg')),
        dark: _Context.asAbsolutePath(path.join('resources', 'images', 'synthesis', 'dark', 'project.svg'))
    };
    
}

class SynthesisTopLevel extends SynthesisItem{

    constructor(
        public readonly SynthesisTopLevelName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisTopLevelName, collapsibleState);
    }

    description = "top level";

    contextValue = eSynthesisViewItemContextValue.synthesisTopLevel;

    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources', 'images','synthesis' , 'light', 'toplevel.svg')),
        dark: _Context.asAbsolutePath(path.join('resources', 'images', 'synthesis', 'dark', 'toplevel.svg'))
    };
}

class SynthesisDevice extends SynthesisItem{

    constructor(
        public readonly SynthesisDeviceName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisDeviceName, collapsibleState);
    }

    description = "device";

    contextValue = eSynthesisViewItemContextValue.synthesisDevice;

    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources', 'images','synthesis' , 'light', 'device.svg')),
        dark: _Context.asAbsolutePath(path.join('resources', 'images', 'synthesis', 'dark', 'device.svg'))
    };
}

class SynthesisFamily extends SynthesisItem{

    constructor(
        public readonly SynthesisFamilyName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisFamilyName, collapsibleState);
    }

    description = "family";

    contextValue = eSynthesisViewItemContextValue.synthesisFamily;

    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources', 'images','synthesis' , 'light', 'family.svg')),
        dark: _Context.asAbsolutePath(path.join('resources', 'images', 'synthesis', 'dark', 'family.svg'))
    };
}

class SynthesisFiles extends SynthesisItem{

    constructor(
        public readonly SynthesisFilesName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisFilesName, collapsibleState);
    }

    contextValue = eSynthesisViewItemContextValue.synthesisFiles;

    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources', 'images','project' , 'light', 'files.svg')),
        dark: _Context.asAbsolutePath(path.join('resources', 'images', 'project' , 'dark', 'files.svg'))
    };
}

class SynthesisFile extends SynthesisItem{

    constructor(
        public readonly SynthesisFileName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisFileName, collapsibleState);
    }

    contextValue = eSynthesisViewItemContextValue.synthesisFile;

    tooltip = path.basename(this.SynthesisFileName);

    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources', 'images','project' , 'light', 'file.svg')),
        dark: _Context.asAbsolutePath(path.join('resources', 'images', 'project' , 'dark', 'file.svg'))
    };
}