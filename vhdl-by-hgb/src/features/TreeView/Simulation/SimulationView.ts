// specific imports
import { eSimulationTool, SimulationGraphicsMap } from '../../VHDLtools/Simulation/SimulationPackage';

// general imports
import * as vscode from 'vscode';
import * as path from 'path';

let _Context : vscode.ExtensionContext;

export class SimulationViewProvider implements vscode.TreeDataProvider<SimulationItem>{

    private mWorkSpacePath : string;
    private mSimulationProjects : Map<eSimulationTool, string[]>;

    constructor(synthesisProjects : Map<eSimulationTool, string[]>, context : vscode.ExtensionContext, workspacePath : string){
        this.mWorkSpacePath = workspacePath;
        this.mSimulationProjects = synthesisProjects;
        _Context = context;
    }

    getTreeItem(element: SimulationItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element: SimulationTool): vscode.ProviderResult<SimulationItem[]> {

        if(element){
            return element.children;
        }
        else{
            return this.fillRoots(element);
        }
    }

    private fillRoots(synthesisItem : SimulationItem) : SimulationItem[]
    {
        let tools : SimulationTool[] = [];

        for(const [simulationTool, simulationProjects] of this.mSimulationProjects)
        {
            const tool : SimulationTool = new SimulationTool(simulationTool, vscode.TreeItemCollapsibleState.Collapsed);

            for (const project of simulationProjects)
            {
                const simulationProject : SimulationProject = new SimulationProject(
                                                                    path.relative(this.mWorkSpacePath, project),
                                                                    vscode.TreeItemCollapsibleState.None);
                
                tool.children.push(simulationProject);
            }

            tools.push(tool);
        }    
              
        return tools;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<SimulationTool | undefined | null | void > =
    new vscode.EventEmitter <SimulationTool | undefined | null | void >();

    readonly onDidChangeTreeData: vscode.Event<SimulationTool | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void{
        this._onDidChangeTreeData.fire();
    }
}

class SimulationItem extends vscode.TreeItem{

    public children : SimulationItem[] = [];

    constructor(
        public readonly simulationToolName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(simulationToolName, collapsibleState);
    }
}

class SimulationTool extends SimulationItem{

    constructor(
        public readonly simulationTool : eSimulationTool,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(simulationTool.valueOf(), collapsibleState);
    }

    iconPath = {
        light: _Context.asAbsolutePath(SimulationGraphicsMap.get(this.simulationTool)!),
        dark: _Context.asAbsolutePath(SimulationGraphicsMap.get(this.simulationTool)!)
    };

}

class SimulationProject extends SimulationItem{

    constructor(
        public readonly simulationProjectPath : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(simulationProjectPath, collapsibleState);
    }

    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources', 'images','simulation' , 'light' ,'project.svg')),
        dark: _Context.asAbsolutePath(path.join('resources', 'images', 'simulation', 'dark', 'project.svg'))
    };    

    tooltip = path.basename(this.simulationProjectPath);
}