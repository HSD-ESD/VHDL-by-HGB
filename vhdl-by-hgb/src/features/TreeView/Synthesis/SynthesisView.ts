import * as vscode from 'vscode';
import { ISynthesisProject  } from '../../VHDLtools/Synthesis/SynthesisProject';
import { SynthesisGraphicsMap, eSynthesisTool } from '../../VHDLtools/Synthesis/SynthesisPackage';
import * as path from 'path';

let _Context : vscode.ExtensionContext;

export class SynthesisViewProvider implements vscode.TreeDataProvider<SynthesisItem>{

    private mSynthesisProjects : Map<eSynthesisTool, Array<ISynthesisProject>>;

    constructor(synthesisProjects : Map<eSynthesisTool, Array<ISynthesisProject>>, context : vscode.ExtensionContext) {
        this.mSynthesisProjects = synthesisProjects;
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

            for ( const synthesisProject of synthesisProjects)
            {
                const  project : SynthesisProject = new SynthesisProject(synthesisProject.GetName(), vscode.TreeItemCollapsibleState.Collapsed);

                project.children.push(new SynthesisTopLevel(synthesisProject.GetTopLevelEntity(), vscode.TreeItemCollapsibleState.None));
                project.children.push(new SynthesisDevice (synthesisProject.GetDevice() , vscode.TreeItemCollapsibleState.None));
                project.children.push( new SynthesisFamily(synthesisProject.GetFamily(), vscode.TreeItemCollapsibleState.None));
                
                let synthesisFiles : SynthesisFiles = new SynthesisFiles("files", vscode.TreeItemCollapsibleState.Collapsed);
                
                for (const currentFile of synthesisProject.GetFiles()){
                    synthesisFiles.children.push(new SynthesisFile(currentFile, vscode.TreeItemCollapsibleState.None));
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

class SynthesisItem extends vscode.TreeItem{

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

    iconPath = {
        light: _Context.asAbsolutePath(SynthesisGraphicsMap.get(this.synthesisTool)!),
        dark: _Context.asAbsolutePath(SynthesisGraphicsMap.get(this.synthesisTool)!)
    };
}

class SynthesisProject extends SynthesisItem{

    constructor(
        public readonly SynthesisProjectName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisProjectName, collapsibleState);
    }

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

    tooltip = path.basename(this.SynthesisFileName);

    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources', 'images','project' , 'light', 'file.svg')),
        dark: _Context.asAbsolutePath(path.join('resources', 'images', 'project' , 'dark', 'file.svg'))
    };
}