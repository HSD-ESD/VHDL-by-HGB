import * as vscode from 'vscode';
import { SynthesisManager } from '../../VHDLtools/Synthesis/SynthesisManager';
import { ISynthesisProject  } from '../../VHDLtools/Synthesis/SynthesisProject';
import { eSynthesisTool } from '../../VHDLtools/Synthesis/SynthesisPackage';
import * as path from 'path';
import { TreeItem } from 'vscode';
import { type } from 'os';
import { isElement } from 'lodash';



export class SynthesisViewProvider implements vscode.TreeDataProvider<SynthesisItem>{

    private mSynthesisProjects : Map<eSynthesisTool, Array<ISynthesisProject>>;

    constructor(synthesisProjects : Map<eSynthesisTool, Array<ISynthesisProject>>){
        this.mSynthesisProjects = synthesisProjects;
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
            const tool : SynthesisTool = new SynthesisTool(synthesisTool.valueOf(), vscode.TreeItemCollapsibleState.Collapsed);

            for ( const synthesisProject of synthesisProjects)
            {
                const  project : SynthesisProject = new SynthesisProject(synthesisProject.GetName(), vscode.TreeItemCollapsibleState.Collapsed);

                project.children.push(new SynthesisTopLevel(synthesisProject.GetTopLevelEntity(), vscode.TreeItemCollapsibleState.None));
                project.children.push(new SynthesisDevice (synthesisProject.GetDevice() , vscode.TreeItemCollapsibleState.None));
                project.children.push( new SynthesisFamily(synthesisProject.GetFamily(), vscode.TreeItemCollapsibleState.None));
                
                let synthesisFiles : SynthesisFiles = new SynthesisFiles("Project Files", vscode.TreeItemCollapsibleState.Collapsed);
                
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
        public readonly SynthesisToolName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisToolName, collapsibleState);
    }

    iconPath = {
        light: path.join(__filename,  '..', '..', '..', '..', '..', 'resources', 'images','synthesis', 'quartus.svg'),
        dark: path.join(__filename,  '..', '..', '..', '..', '..', 'resources', 'images', 'synthesis', 'quartus.svg')
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
        light: path.join(__filename,  '..', '..', '..', '..', '..', 'resources', 'images','synthesis' , 'light', 'project.svg'),
        dark: path.join(__filename,  '..', '..', '..', '..', '..', 'resources', 'images', 'synthesis', 'dark', 'project.svg')
    };
    
}

class SynthesisTopLevel extends SynthesisItem{

    constructor(
        public readonly SynthesisTopLevelName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisTopLevelName, collapsibleState);
    }

    description = "Top Level";
}

class SynthesisDevice extends SynthesisItem{

    constructor(
        public readonly SynthesisDeviceName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisDeviceName, collapsibleState);
    }

    description = "Device";
}

class SynthesisFamily extends SynthesisItem{

    constructor(
        public readonly SynthesisFamilyName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisFamilyName, collapsibleState);
    }

    description = "Family";
}

class SynthesisFiles extends SynthesisItem{

    constructor(
        public readonly SynthesisFilesName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisFilesName, collapsibleState);
    }
}

class SynthesisFile extends SynthesisItem{

    constructor(
        public readonly SynthesisFileName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(SynthesisFileName, collapsibleState);
    }

    tooltip = path.basename(this.SynthesisFileName);
}