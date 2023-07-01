//specific imports
import { FileHolder } from "../../FileTools/FileHolder";
import { SynthesisWizard } from "./SynthesisWizard";
import { ISynthesisProject, TSynthesisProjectConfig } from "./SynthesisProject";
import { SynthesisFileMap, SynthesisToolMap, eSynthesisFile } from "./SynthesisPackage";

//general imports
import * as vscode from 'vscode';
import * as path from 'path';
import { ISynthesisFactory } from "./Factory/SynthesisFactory";

export class SynthesisManager 
{
    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mSynthesisProjects : Array<ISynthesisProject>;
    private mWizard : SynthesisWizard;
    private mActiveProject! : ISynthesisProject;

    private mWorkSpacePath : string;

    //vscode-members
    private mOutputChannel : vscode.OutputChannel;
    private mContext : vscode.ExtensionContext;


    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    constructor(workSpacePath : string ,context : vscode.ExtensionContext)
    {
        //vs-code members
        this.mOutputChannel = vscode.window.createOutputChannel('VHDLbyHGB.Synthesis');
        this.mContext = context;

        //custom-members
        this.mWorkSpacePath = workSpacePath;
        this.mSynthesisProjects = new Array<ISynthesisProject>();
        this.mWizard = new SynthesisWizard(this.mWorkSpacePath);

        this.RegisterCommands();
    }

    public async Initialize() : Promise<void>
    {
        this.LoadSynthesisProjects();
    }

    public async AddNewProject() : Promise<boolean>
    {
        // ask user to set configuration for new synthesis-project
        let projectConfig : TSynthesisProjectConfig = await this.mWizard.Run();
        // check selected configuration for validity
        if(projectConfig.factory === undefined || projectConfig.folderPath.length === 0 || projectConfig.name.length === 0)
        {
            vscode.window.showErrorMessage("Synthesis-Project could not be generated!");
            return false;
        }

        //use factory of selected synthesis-tool to create a synthesis-project
        let newProject : ISynthesisProject = projectConfig.factory.CreateProject(projectConfig.name, projectConfig.folderPath, this.mContext);
        //Generate Project-Files
        newProject.Generate();
        //add generated project to container of all synthesis-projects
        this.mSynthesisProjects.push(newProject);
        //set new Project as active project
        this.mActiveProject = newProject;

        return true;
    }

    public async AddExistingProject(projectFile : string) : Promise<boolean>
    {
        const fileName = path.basename(projectFile);
        const projectName = fileName.split('.')[0];
        const projectPath = path.dirname(projectFile);
        const synthesisFile = fileName.split('.')[1] as eSynthesisFile;
        const synthesisTool = SynthesisFileMap.get(synthesisFile);

        let synthesisFactory : ISynthesisFactory | undefined;
        if(synthesisTool)
        {   
            synthesisFactory = SynthesisToolMap.get(synthesisTool);
        }
        if(synthesisFactory)
        {
            synthesisFactory.CreateProject(projectName, projectPath, this.mOutputChannel, this.mContext, this.mFileHolder);
        }

        return true;
    }

    public async SetActiveProject() : Promise<boolean>
    {
        const selectedProject = await this.mWizard.SelectActiveProject(this.mSynthesisProjects);

        if(!selectedProject)
        {
            vscode.window.showErrorMessage("No Synthesis-Project selected!");
            return false;
        }
       
        this.mActiveProject = selectedProject;
        vscode.window.showInformationMessage(`Active Synthesis-Project: ${path.relative(this.mWorkSpacePath, this.mActiveProject.GetPath())}`);

        return true;
    }

    public async UpdateFiles() : Promise<boolean>
    {
        // check, if a synthesis-project is selected
        if(!this.mActiveProject)
        {
            vscode.window.showErrorMessage("No Synthesis-Project selected for updating files!");
            return false;
        }

        // update files of selected synthesis-project
        const IsSuccess : boolean = await this.mActiveProject.UpdateFiles();

        if(!IsSuccess)
        {
            vscode.window.showErrorMessage("Files of selected Synthesis-Project could not be updated!");
        }

        return IsSuccess;
    }

    public async LaunchGUI() : Promise<boolean>
    {
        // check, if a synthesis-project is selected
        if(!this.mActiveProject)
        {
            vscode.window.showErrorMessage("No Synthesis-Project selected for launching GUI!");
            return false;
        }

        // launch GUI of selected synthesis-project
        const IsSuccess : boolean = await this.mActiveProject.LaunchGUI();

        if(!IsSuccess)
        {
            vscode.window.showErrorMessage("GUI of selected Synthesis-Project could not be launched!");
        }

        return IsSuccess;
    }

    public async Compile() : Promise<boolean>
    {
        // check, if a synthesis-project is selected
        if(!this.mActiveProject)
        {
            vscode.window.showErrorMessage("No Synthesis-Project selected for compiling!");
            return false;
        }

        // compile selected synthesis-project
        const IsSuccess : boolean = await this.mActiveProject.Compile();

        if(!IsSuccess)
        {
            vscode.window.showErrorMessage("Selected Synthesis-Project could not be compiled!");
        }

        return IsSuccess;
    }

    
    public async SetTopLevelEntity() : Promise<boolean>
    {
        // check, if a synthesis-project is selected
        if(!this.mActiveProject)
        {
            vscode.window.showErrorMessage("No Synthesis-Project selected for setting Top-Level-Entity!");
            return false;
        }

        // ask user to select top-level-entity
        const Entity : VhdlEntity = await this.mWizard.SelectTopLevelEntity();

        //check selected entity for validity
        if(Entity.mName.length === 0 || Entity.mPath.length === 0)
        {
            vscode.window.showErrorMessage("No valid TopLevelEntity chosen for selected Synthesis-Project!");
            return false;
        }

        // set TopLevelEntity for selected synthesis-project
        const IsSuccess : boolean = await this.mActiveProject.SetTopLevel(Entity);

        if(!IsSuccess)
        {
            vscode.window.showErrorMessage("TopLevelEntity could not be set for selected Synthesis-Project!");
        }

        return IsSuccess;
    }

    public async SetFamily() : Promise<boolean>
    {
        // check, if a synthesis-project is selected
        if(!this.mActiveProject)
        {
            vscode.window.showErrorMessage("No Synthesis-Project selected for setting Family!");
            return false;
        }

        // ask user to select top-level-entity
        const FamilyName : string = await this.mWizard.SelectFamily();

        //check selected entity for validity
        if(FamilyName.length === 0)
        {
            vscode.window.showErrorMessage("No valid Family chosen for selected Synthesis-Project!");
            return false;
        }

        // set TopLevelEntity for selected synthesis-project
        const IsSuccess : boolean = await this.mActiveProject.SetFamily(FamilyName);

        if(!IsSuccess)
        {
            vscode.window.showErrorMessage("Family could not be set for selected Synthesis-Project!");
        }

        return IsSuccess;
    }

    public async SetDevice() : Promise<boolean>
    {
        // check, if a synthesis-project is selected
        if(!this.mActiveProject)
        {
            vscode.window.showErrorMessage("No Synthesis-Project selected for setting Device!");
            return false;
        }

        // ask user to select top-level-entity
        const DeviceName : string = await this.mWizard.SelectDevice();

        //check selected entity for validity
        if(DeviceName.length === 0)
        {
            vscode.window.showErrorMessage("No valid Device chosen for selected Synthesis-Project!");
            return false;
        }

        // set TopLevelEntity for selected synthesis-project
        const IsSuccess : boolean = await this.mActiveProject.SetDevice(DeviceName);

        if(!IsSuccess)
        {
            vscode.window.showErrorMessage("Device could not be set for selected Synthesis-Project!");
        }

        return IsSuccess;
    }

    // --------------------------------------------
    // Private methods
    // --------------------------------------------

    private async LoadSynthesisProjects() : Promise<void>
    {
        const synthesisProjects : string[] = await this.FindSynthesisProjects();

        synthesisProjects.forEach((project) => 
        {
            this.AddExistingProject(project);
        });
    }

    private async FindSynthesisProjects() : Promise<string[]>
    {
        const workspaceFolder = (vscode.workspace.workspaceFolders || [])[0];
        const fileExtensions = Object.values(eSynthesisFile);
        const filePattern = `**/*{${fileExtensions.join(",")}}`;

        const results = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceFolder, filePattern)
        );

        let synthesisProjects : string[] = results.map((file) => {
            return file.fsPath;
        });

        return synthesisProjects;
    }

    private RegisterCommands(): void {

        let disposable: vscode.Disposable;

        disposable = vscode.commands.registerCommand("VHDLbyHGB.SynthesisManager.AddNewProject", () => { this.AddNewProject(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.SynthesisManager.UpdateFiles", () => { this.UpdateFiles(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.SynthesisManager.Compile", () => { this.Compile(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.SynthesisManager.LaunchGUI", () => { this.LaunchGUI(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.SynthesisManager.SetTopLevelEntity", () => { this.SetTopLevelEntity(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.SynthesisManager.SetDevice", () => { this.SetDevice(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.SynthesisManager.SetFamily", () => { this.SetFamily(); });
        this.mContext.subscriptions.push(disposable);
    }

}