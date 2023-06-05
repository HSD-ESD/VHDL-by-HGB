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

        this.HandleFileEvents();
        this.RegisterCommands();
    }

    public async Initialize() : Promise<void>
    {
        this.Update();
    }

    public async SetActiveProject() : Promise<boolean>
    {
        // quick pick menu with available tools (including no tool)
        const toolOptions = [...Object.values(eSimulationTool), 'None'];
        let selectedTool = await vscode.window.showQuickPick(toolOptions);

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
            else if (selectedTool === 'None') {
                //no active project
                this.mContext.workspaceState.update(ACTIVE_SIMULATION_PROJECT, "");
                vscode.window.showInformationMessage("No active Simulation-Project!");
                vscode.commands.executeCommand("VHDLbyHGB.ProjectManager.RefreshVhdlFinder")
                .then(
                    () => {vscode.commands.executeCommand("VHDLbyHGB.ProjectManager.Update");}
                );
                return true;
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
            //if active SimulationProject does not exist anymore -> VhdlFinder must be changed
            const activeSimulationProject : TSimulationProject | undefined = this.mContext.workspaceState.get(ACTIVE_SIMULATION_PROJECT);
            if (activeSimulationProject)
            {
                if (!this.mVUnitProjects.includes(activeSimulationProject.file))
                {
                    vscode.commands.executeCommand("VHDLbyHGB.ProjectManager.RefreshVhdlFinder");
                }
            }
        }
    }

    private async HandleFileEvents() : Promise<void>
    {
        vscode.workspace.onDidCreateFiles((event) => 
        {
            const containsSimulationProject : boolean = event.files.some((file) => {
                const filePath = file.fsPath.toLowerCase();
                return filePath.endsWith('run.py');
            });
            if(containsSimulationProject)
            {
                this.Update();
            }
        });

        vscode.workspace.onDidDeleteFiles((event) => 
        {
            const containsSimulationProject : boolean = event.files.some((file) => {
                const filePath = file.fsPath.toLowerCase();
                return filePath.endsWith('run.py');
            });
            if(containsSimulationProject)
            {
                this.Update();
            }
        });

        vscode.workspace.onDidRenameFiles((event) => 
        {
            const containsSimulationProject : boolean = event.files.some((file) => {
                const newFilePath = file.newUri.fsPath.toLowerCase();
                const oldFilePath = file.oldUri.fsPath.toLowerCase();
                return newFilePath.endsWith('run.py') || oldFilePath.endsWith('run.py');
            });
            if(containsSimulationProject)
            {
                this.Update();
            }
        });
    }

    private RegisterCommands(): void {

        let disposable: vscode.Disposable;

        disposable = vscode.commands.registerCommand("VHDLbyHGB.SimulationManager.SetActiveProject", () => { this.SetActiveProject(); });
        this.mContext.subscriptions.push(disposable);
    }

    
}


