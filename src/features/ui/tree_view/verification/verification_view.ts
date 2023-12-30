// specific imports
import { eVerificationTool, VerificationGraphicsMap } from '../../../hdl_tools/verification/verification_package';

// general imports
import * as vscode from 'vscode';
import * as path from 'path';

let _Context : vscode.ExtensionContext;

export class VerificationViewProvider implements vscode.TreeDataProvider<VerificationItem>{

    private mWorkSpacePath : string;
    private mVerificationProjects : Map<eVerificationTool, string[]>;

    constructor(synthesisProjects : Map<eVerificationTool, string[]>, context : vscode.ExtensionContext, workspacePath : string){
        this.mWorkSpacePath = workspacePath;
        this.mVerificationProjects = synthesisProjects;
        _Context = context;
    }

    getTreeItem(element: VerificationItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element: VerificationTool): vscode.ProviderResult<VerificationItem[]> {

        if(element){
            return element.children;
        }
        else{
            return this.fillRoots(element);
        }
    }

    private fillRoots(synthesisItem : VerificationItem) : VerificationItem[]
    {
        let tools : VerificationTool[] = [];

        for(const [verificationTool, verificationProjects] of this.mVerificationProjects)
        {
            if (verificationProjects.length === 0)
            {
                continue;
            }

            const tool : VerificationTool = new VerificationTool(verificationTool, vscode.TreeItemCollapsibleState.Collapsed);

            for (const project of verificationProjects)
            {
                const verificationProject : VerificationProject = new VerificationProject(
                                                                    path.relative(this.mWorkSpacePath, project),
                                                                    vscode.TreeItemCollapsibleState.None);
                verificationProject.resourceUri = vscode.Uri.file(project);
                verificationProject.command = {
                    title: `open ${verificationProject.tooltip}`,
                    command: 'vscode.open',
                    arguments: [verificationProject.resourceUri],
                };
                tool.children.push(verificationProject);
            }

            tools.push(tool);
        }    
              
        return tools;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<VerificationTool | undefined | null | void > =
    new vscode.EventEmitter <VerificationTool | undefined | null | void >();

    readonly onDidChangeTreeData: vscode.Event<VerificationTool | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void{
        this._onDidChangeTreeData.fire();
    }
}

export class VerificationItem extends vscode.TreeItem{

    public children : VerificationItem[] = [];

    constructor(
        public readonly verificationToolName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(verificationToolName, collapsibleState);
    }
}

class VerificationTool extends VerificationItem{

    constructor(
        public readonly verificationTool : eVerificationTool,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(verificationTool.valueOf(), collapsibleState);
    }

    iconPath = {
        light: _Context.asAbsolutePath(VerificationGraphicsMap.get(this.verificationTool)!),
        dark: _Context.asAbsolutePath(VerificationGraphicsMap.get(this.verificationTool)!)
    };

}

class VerificationProject extends VerificationItem{

    constructor(
        public readonly verificationProjectPath : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(verificationProjectPath, collapsibleState);
    }

    iconPath = {
        light: _Context.asAbsolutePath(path.join('resources', 'images','verification' , 'light' ,'project.svg')),
        dark: _Context.asAbsolutePath(path.join('resources', 'images', 'verification', 'dark', 'project.svg'))
    };    

    tooltip = path.basename(this.verificationProjectPath);
}