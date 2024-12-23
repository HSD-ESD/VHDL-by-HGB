//specific imports
import { ACTIVE_VERIFICATION_PROJECT, EnabledVerificationTools as EnabledVerificationTools, NO_VERIFICATION_PROJECT, VerificationToolMap as VerificationToolMap, TVerificationProject as TVerificationProject, eVerificationTool as eVerificationTool, getVerificationToolBaseNameFromTool as getVerificationToolBaseNameFromTool, getVerificationToolFromScriptPath as getVerificationToolFromScriptPath} from './verification_package'; 
import { VerificationWizard } from './verification_wizard';
import { VerificationWizardUi } from './verification_wizard_ui';
import { ISourceFinder } from '../../utils/hdl/source_finder/source_finder';
import { SimpleSourceFinder } from '../../utils/hdl/source_finder/simple_source_finder';
import { VerificationViewProvider, VerificationItem} from '../../ui/tree_view/verification/verification_view';

//general imports
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


export class VerificationManager {

    // --------------------------------------------
    // Public members
    // --------------------------------------------

    //events
    public readonly ActiveVerificationProjectChanged : vscode.EventEmitter<void>;

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
    private mWizard : VerificationWizard;
    // private mWizardUi : VerificationWizardUi;  // currently unused

    //VerificationProjects
    private mVerificationProjects : Map<eVerificationTool,string[]>;
    private mActiveProject : TVerificationProject | undefined;

    // UI
    private mVerificationViewProvider : VerificationViewProvider;
    private mVerificationView : vscode.TreeView<VerificationItem>;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    constructor(context : vscode.ExtensionContext)
    {
        // vs-code members
        this.mContext = context;
        this.mOutputChannel = vscode.window.createOutputChannel('VHDLbyHGB.Verification');
        this.ActiveVerificationProjectChanged = new vscode.EventEmitter();

        this.mStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.mStatusBarItem.name = "Active Verification-Project";
        this.mStatusBarItem.command = "VHDLbyHGB.Verification.SetActiveProject";
        this.mStatusBarItem.tooltip = "VHDLbyHGB: Select HDL Verification-Project";
        this.mStatusBarItem.show();

        // specific members

        //get workspace path
        const workspaceFolder = (vscode.workspace.workspaceFolders || [])[0];
        if (workspaceFolder) {
            this.mWorkSpacePath = workspaceFolder.uri.fsPath;
        }

        this.mWizard = new VerificationWizard(this.mContext, this.mWorkSpacePath);
        // this.mWizardUi = new VerificationWizardUi(this.mContext);

        this.mVerificationProjects = new Map<eVerificationTool, string[]>();

        // UI
        this.mVerificationViewProvider = new VerificationViewProvider(this.mVerificationProjects, this.mContext, this.mWorkSpacePath);
        this.mVerificationView = vscode.window.createTreeView<VerificationItem>(
            'vhdlbyhgb-view-verification',{
            treeDataProvider : this.mVerificationViewProvider
        });

        this.HandleFileEvents();
        this.RegisterCommands();
    }

    public async Initialize() : Promise<void>
    {
        await this.Update();
    }

    public async SetActiveProject() : Promise<boolean>
    {
        const selectedTool : eVerificationTool | undefined = await this.mWizard.SelectTool();
        if(!selectedTool)
        {
            return false;
        }

        // check, if user decides to reset active verification-project.
        // This option could also be part of the enum eVerificationTool,
        // but would not be clean, because then mVerificationProjects would have a key
        // for eVerificationTool.None, which would not make sense.
        // Therefore, this "hacky", but working solution.
        if(selectedTool as string === NO_VERIFICATION_PROJECT)
        {
            this.updateActiveVerificationProject(undefined);
            return true;
        }

        const projects = this.mVerificationProjects.get(selectedTool);
        if(!projects)
        {
            return false;
        }

        const selectedProject = await this.mWizard.SelectActiveProject(projects);
        if(!selectedProject)
        {
            vscode.window.showErrorMessage("No Verification-Project selected!");
            return false;
        }

        const verificationProject : TVerificationProject = {
            tool: selectedTool,
            file: selectedProject
        };

        this.updateActiveVerificationProject(verificationProject);

        if(this.mActiveProject)
        {
            vscode.window.showInformationMessage(`Active Verification-Project: ${path.relative(this.mWorkSpacePath, this.mActiveProject.file)}`);
        }

        return true;
    }

    public GetVhdlFinder() : ISourceFinder
    {
        //default Finder
        let vhdlFinder : ISourceFinder = new SimpleSourceFinder();

        if (!this.mActiveProject)
        {
            return vhdlFinder;
        }

        if(!fs.existsSync(this.mActiveProject.file))
        {
            return vhdlFinder;
        }

        const verificationFactory = VerificationToolMap.get(this.mActiveProject.tool);

        if(!verificationFactory)
        {
            return vhdlFinder;
        }

        vhdlFinder = verificationFactory.CreateVhdlFinder(this.mActiveProject.file, this.mOutputChannel);

        return vhdlFinder;
    }

    public AddExistingProject(scriptPath : string) : boolean
    {
        const tool : eVerificationTool | undefined = getVerificationToolFromScriptPath(scriptPath);
        if(!tool)
        {
            return false;
        }

        if(!EnabledVerificationTools.includes(tool))
        {
            return false;
        }


        if (!this.mVerificationProjects.has(tool))
        {
            this.mVerificationProjects.set(tool, []);
        }

        const projects = this.mVerificationProjects.get(tool);

        if(!projects) { return false;}

        if(projects.includes(scriptPath))
        {
            return false;
        }

        projects.push(scriptPath);

        projects.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        this.mVerificationProjects.set(tool, projects);

        return true;
    }


    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private async Update() : Promise<void> 
    {
        await this.LoadVerificationProjects();
        this.updateStatusBar();
        this.mVerificationViewProvider.refresh();
    }

    private async HandleFileEvents() : Promise<void>
    {
        vscode.workspace.onDidCreateFiles((event) => 
        {
            const containsVerificationProject : boolean = event.files.some((file) => {
                const filePath = file.fsPath.toLowerCase();
                return this.IsVerificationProject(filePath);
            });
            if(containsVerificationProject)
            {
                this.Update();
            }
        });

        vscode.workspace.onDidDeleteFiles((event) => 
        {
            const containsVerificationProject : boolean = event.files.some((file) => {
                const filePath = file.fsPath.toLowerCase();
                return this.IsVerificationProject(filePath);
            });
            if(containsVerificationProject)
            {
                this.Update();
            }
        });

        vscode.workspace.onDidRenameFiles((event) => 
        {
            const containsVerificationProject : boolean = event.files.some((file) => {
                const newFilePath = file.newUri.fsPath.toLowerCase();
                const oldFilePath = file.oldUri.fsPath.toLowerCase();
                return this.IsVerificationProject(newFilePath) || this.IsVerificationProject(oldFilePath);
            });
            if(containsVerificationProject)
            {
                this.Update();
            }
        });
    }

    private async LoadVerificationProjects() : Promise<void>
    {   
        const workspaceFolder = (vscode.workspace.workspaceFolders || [])[0];
        const enabledVerificationScriptNames : string[] = [];

        EnabledVerificationTools.forEach((tool) => {
            const scriptBaseName = getVerificationToolBaseNameFromTool(tool);
            if (scriptBaseName)
            {
                enabledVerificationScriptNames.push(scriptBaseName);
            }
        });
        if (enabledVerificationScriptNames.length === 0) { return; }

        const filePattern = `**/*{${enabledVerificationScriptNames.join(",")}}`;

        const results = await vscode.workspace.findFiles(
            new vscode.RelativePattern(workspaceFolder, filePattern)
        );

        let verificationProjects : string[] = results.map((file) => {
            return file.fsPath;
        });
        verificationProjects.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        verificationProjects.forEach((project) => {
            this.AddExistingProject(project);
        });

        // active verification project
        this.loadActiveVerificationProject();
    }

    private saveActiveVerificationProject() : void 
    {
        if(!this.mActiveProject) 
        {
            this.mContext.workspaceState.update(ACTIVE_VERIFICATION_PROJECT, undefined);
            return; 
        }
        
        this.mContext.workspaceState.update(ACTIVE_VERIFICATION_PROJECT, this.mActiveProject);
    }

    private loadActiveVerificationProject() : void
    {
        const activeVerificationProject : TVerificationProject | undefined = this.mContext.workspaceState.get(ACTIVE_VERIFICATION_PROJECT);

        if(!activeVerificationProject) { return; }

        const projects = this.mVerificationProjects.get(activeVerificationProject.tool);

        if(!projects) { return; }

        const activeProject = projects.find((project) => {return project === activeVerificationProject.file;});

        if(!activeProject) { return; }

        this.mActiveProject = activeVerificationProject;
    }   

    private updateActiveVerificationProject(project : TVerificationProject | undefined) : void
    {
        this.mActiveProject = project;
        this.saveActiveVerificationProject();
        this.updateStatusBar();
        this.ActiveVerificationProjectChanged.fire();
    }

    private updateStatusBar(): void {
        if(!this.mActiveProject) 
        {
            this.mStatusBarItem.text = NO_VERIFICATION_PROJECT;
            return; 
        }

        this.mStatusBarItem.text = path.basename(this.mActiveProject.file);
    }

    private IsVerificationProject(filePath : string) : boolean
    {
        const tool : eVerificationTool | undefined = getVerificationToolFromScriptPath(filePath);
        if(!tool)
        {
            return false;
        }

        if(!EnabledVerificationTools.includes(tool))
        {
            return false;
        }

        return true;
    }

    private RegisterCommands(): void {

        let disposable: vscode.Disposable;

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Verification.View.Refresh", () => { this.mVerificationViewProvider.refresh(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Verification.SetActiveProject", () => { this.SetActiveProject(); });
        this.mContext.subscriptions.push(disposable);
    }

}


