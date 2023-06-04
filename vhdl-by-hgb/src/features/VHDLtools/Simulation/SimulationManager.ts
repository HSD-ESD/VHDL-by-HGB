//specific imports
import { ACTIVE_SIMULATION_PROJECT, TSimulationProject, eSimulationTool } from './SimulationPackage'; 
import { VUnit } from './VUnit/VUnit';
import { SimulationWizard } from './SimulationWizard';

//general imports
import * as vscode from 'vscode';
import * as path from 'path';


export class SimulationManager {

    // --------------------------------------------
    // Private members
    // --------------------------------------------

    //vscode-members
    private mContext : vscode.ExtensionContext;
    private mVUnitWatcher : vscode.FileSystemWatcher;
    private mOutputChannel : vscode.OutputChannel;

    //general
    private mWorkSpacePath : string = "";
    private mWizard : SimulationWizard;

    //VUnit
    private mVUnit : VUnit;
    private mVUnitProjects : Array<string>;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    constructor(context : vscode.ExtensionContext)
    {
        //init vs-code members
        this.mContext = context;
        this.mOutputChannel = vscode.window.createOutputChannel('VHDLbyHGB:Simulation');

        //init specific members
        this.mVUnit = new VUnit();
        this.mVUnitProjects = new Array<string>();
        this.mWizard = new SimulationWizard(this.mContext);
        //this.mWizard.Run();

        //get workspace path
        const workspaceFolder = (vscode.workspace.workspaceFolders || [])[0];
        let wsRoot: string | undefined = undefined;
        if (workspaceFolder) {
            this.mWorkSpacePath = workspaceFolder.uri.fsPath;
        }

        //watch all python files
        this.mVUnitWatcher = vscode.workspace.createFileSystemWatcher(path.join(this.mWorkSpacePath, "**/*.py"));
        
        //handle events for VUnitWatcher
        this.mVUnitWatcher.onDidCreate( (uri) => {
            if(uri.fsPath.endsWith("run.py"))
            {
                this.Update();
            }
        });
        this.mVUnitWatcher.onDidDelete( (uri) => {
            if(uri.fsPath.endsWith("run.py"))
            {
                this.Update();
            }
        });

        // Start watching the workspace-folder
        const disposable = vscode.Disposable.from(this.mVUnitWatcher);
        // Dispose the watcher when extension is not active
        context.subscriptions.push(disposable);

        this.RegisterCommands();
    }

    public async Initialize() : Promise<void>
    {
        this.Update();
    }

    public async SetActiveProject() : Promise<boolean>
    {
        // quick pick menu with available tools
        let selectedTool = await vscode.window.showQuickPick(Object.values(eSimulationTool));

        if(selectedTool)
        {
            let selectedProject : string | undefined;

            if(selectedTool === eSimulationTool.VUnit)
            {
                selectedProject = await vscode.window.showQuickPick(this.mVUnitProjects);
                if(selectedProject)
                {
                    const simulationProject : TSimulationProject = {
                        tool: selectedTool,
                        file: selectedProject
                    };
                    this.mContext.workspaceState.update(ACTIVE_SIMULATION_PROJECT, simulationProject);
                    vscode.window.showInformationMessage(`VUnit-Project: ${path.relative(this.mWorkSpacePath, selectedProject)} -> Active!`);
                    vscode.commands.executeCommand("VHDLbyHGB.ProjectManager.RefreshVhdlFinder")
                    .then(
                        () => {vscode.commands.executeCommand("VHDLbyHGB.ProjectManager.Update");}
                    );
                    
                    return true;
                }
            }
            
        }

        vscode.window.showErrorMessage("No Simulation-Project was set!");
        return false;
    }

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private async Update() : Promise<void> 
    {
        
        const files = await this.mVUnit.FindRunPy((vscode.workspace.workspaceFolders || [])[0]);
        
        if(files)
        {
            this.mVUnitProjects = files;
        }
    }

    private RegisterCommands(): void {

        let disposable: vscode.Disposable;

        disposable = vscode.commands.registerCommand("VHDLbyHGB.SimulationManager.SetActiveProject", () => { this.SetActiveProject(); });
        this.mContext.subscriptions.push(disposable);
    }

    
}


