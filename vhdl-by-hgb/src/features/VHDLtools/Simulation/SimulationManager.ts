//specific imports
import { ACTIVE_SIMULATION_PROJECT, SimulationToolMap, TSimulationProject, eSimulationTool } from './SimulationPackage'; 
import { VUnit } from './VUnit/VUnit';
import { HDLRegression } from './HDLRegression/HDLRegression';
import { SimulationWizard } from './SimulationWizard';
import { SimulationWizardUi } from './SimulationWizardUi';
import { IVhdlFinder } from '../../FileTools/VhdlFinder/VhdlFinder';
import { SimpleVhdlFinder } from '../../FileTools/VhdlFinder/SimpleVhdlFinder';

//general imports
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


export class SimulationManager {

    // --------------------------------------------
    // Public members
    // --------------------------------------------

    //events
    public readonly ActiveSimulationProjectChanged : vscode.EventEmitter<void>;

    // --------------------------------------------
    // Private members
    // --------------------------------------------

    // vscode-members
    private mContext : vscode.ExtensionContext;
    private mOutputChannel : vscode.OutputChannel;
    private mStatusBarItem : vscode.StatusBarItem;

    // specific members
    private mWorkSpacePath : string = "";

    // wizards
    private mWizard : SimulationWizard;
    // private mWizardUi : SimulationWizardUi;  // currently unused

    //SimulationTools
    private mVUnit : VUnit;
    private mHDLRegression : HDLRegression;

    //SimulationProjects
    private mSimulationProjects : Map<eSimulationTool,string[]>;
    private mActiveProject : TSimulationProject | undefined;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    constructor(context : vscode.ExtensionContext)
    {
        // vs-code members
        this.mContext = context;
        this.mOutputChannel = vscode.window.createOutputChannel('VHDLbyHGB.Simulation');
        this.ActiveSimulationProjectChanged = new vscode.EventEmitter();

        this.mStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.mStatusBarItem.name = "Active Simulation-Project";
        this.mStatusBarItem.command = "VHDLbyHGB.Simulation.SetActiveProject";
        this.mStatusBarItem.tooltip = "VHDLbyHGB: Select HDL Simulation-Project";
        this.mStatusBarItem.show();

        // specific members

        //get workspace path
        const workspaceFolder = (vscode.workspace.workspaceFolders || [])[0];
        if (workspaceFolder) {
            this.mWorkSpacePath = workspaceFolder.uri.fsPath;
        }

        this.mWizard = new SimulationWizard(this.mContext, this.mWorkSpacePath);
        // this.mWizardUi = new SimulationWizardUi(this.mContext);

        this.mVUnit = new VUnit(this.mOutputChannel);
        this.mHDLRegression = new HDLRegression(this.mOutputChannel);

        this.mSimulationProjects = new Map<eSimulationTool, string[]>();

        this.HandleFileEvents();
        this.RegisterCommands();
    }

    public async Initialize() : Promise<void>
    {
        await this.LoadSimulationProjects();
        this.updateStatusBar();
    }

    public async SetActiveProject() : Promise<boolean>
    {
        const selectedTool = await this.mWizard.SelectSimulationTool();
        if(!selectedTool)
        {
            return false;
        }

        if(selectedTool === eSimulationTool.None)
        {
            this.updateActiveSimulationProject(undefined);
            return true;
        }

        const projects = this.mSimulationProjects.get(selectedTool);
        if(!projects)
        {
            return false;
        }

        const selectedProject = await this.mWizard.SelectActiveProject(projects);
        if(!selectedProject)
        {
            vscode.window.showErrorMessage("No Simulation-Project selected!");
            return false;
        }

        const simulationProject : TSimulationProject = {
            tool: selectedTool,
            file: selectedProject
        };

        this.updateActiveSimulationProject(simulationProject);

        if(this.mActiveProject)
        {
            vscode.window.showInformationMessage(`Active Simulation-Project: ${path.relative(this.mWorkSpacePath, this.mActiveProject.file)}`);
        }

        return true;
    }

    public GetVhdlFinder() : IVhdlFinder
    {
        //default Finder
        let vhdlFinder : IVhdlFinder = new SimpleVhdlFinder();

        if (!this.mActiveProject)
        {
            return vhdlFinder;
        }

        if(!fs.existsSync(this.mActiveProject.file))
        {
            return vhdlFinder;
        }

        const simulationFactory = SimulationToolMap.get(this.mActiveProject.tool);

        if(!simulationFactory)
        {
            return vhdlFinder;
        }

        vhdlFinder = simulationFactory.CreateVhdlFinder(this.mActiveProject.file, this.mOutputChannel);

        return vhdlFinder;
    }

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private async Update() : Promise<void> 
    {
        this.LoadSimulationProjects();
    }

    private async HandleFileEvents() : Promise<void>
    {
        vscode.workspace.onDidCreateFiles((event) => 
        {
            const containsSimulationProject : boolean = event.files.some((file) => {
                const filePath = file.fsPath.toLowerCase();
                return this.IsSimulationProject(filePath);
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
                return this.IsSimulationProject(filePath);
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
                return this.IsSimulationProject(newFilePath) || this.IsSimulationProject(oldFilePath);
            });
            if(containsSimulationProject)
            {
                this.Update();
            }
        });
    }

    private async LoadSimulationProjects() : Promise<void>
    {   
        // all simulation projects
        const vunitProjects = await this.mVUnit.FindScripts((vscode.workspace.workspaceFolders || [])[0], false);
        this.mSimulationProjects.set(eSimulationTool.VUnit, vunitProjects);

        const hdlregressionProjects = await this.mHDLRegression.FindScripts((vscode.workspace.workspaceFolders || [])[0], false);
        this.mSimulationProjects.set(eSimulationTool.HDLRegression, hdlregressionProjects);

        // active simulation project
        this.loadActiveSimulationProject();
    }

    private saveActiveSimulationProject() : void 
    {
        if(!this.mActiveProject) 
        {
            this.mContext.workspaceState.update(ACTIVE_SIMULATION_PROJECT, undefined);
            return; 
        }
        
        this.mContext.workspaceState.update(ACTIVE_SIMULATION_PROJECT, this.mActiveProject);
    }

    private loadActiveSimulationProject() : void
    {
        const activeSimulationProject : TSimulationProject | undefined = this.mContext.workspaceState.get(ACTIVE_SIMULATION_PROJECT);

        if(!activeSimulationProject) { return; }

        const projects = this.mSimulationProjects.get(activeSimulationProject.tool);

        if(!projects) { return; }

        const activeProject = projects.find((project) => {return project === activeSimulationProject.file;});

        if(!activeProject) { return; }

        this.mActiveProject = activeSimulationProject;
    }   

    private updateActiveSimulationProject(simulationProject : TSimulationProject | undefined) : void
    {
        this.mActiveProject = simulationProject;
        this.saveActiveSimulationProject();
        this.updateStatusBar();
        this.ActiveSimulationProjectChanged.fire();
    }

    private updateStatusBar(): void {
        if(!this.mActiveProject) 
        {
            this.mStatusBarItem.text = eSimulationTool.None;
            return; 
        }

        this.mStatusBarItem.text = path.basename(this.mActiveProject.file);
    }

    private IsSimulationProject(filePath : string) : boolean
    {
        return  filePath.endsWith(vscode.workspace.getConfiguration().get("vhdl-by-hgb.vunitScriptName") as string) ||
                filePath.endsWith(vscode.workspace.getConfiguration().get("vhdl-by-hgb.hdlregressionScriptName") as string);
    }

    private RegisterCommands(): void {

        let disposable: vscode.Disposable;

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Simulation.SetActiveProject", () => { this.SetActiveProject(); });
        this.mContext.subscriptions.push(disposable);
    }

    
}


