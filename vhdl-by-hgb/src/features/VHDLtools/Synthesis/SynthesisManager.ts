//specific imports
import { FileHolder } from "../../FileTools/FileHolder";
import { SynthesisWizard } from "./SynthesisWizard";
import { ISynthesisProject, TSynthesisProjectConfig } from "./SynthesisProject";
import { SynthesisFileMap, SynthesisToolMap, eSynthesisFile, eSynthesisTool } from "./SynthesisPackage";

//general imports
import * as vscode from 'vscode';
import * as path from 'path';
import { VhdlEntity } from "../VhdlPackage";
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
        const synthesisFile = path.extname(projectFile) as eSynthesisFile;
        const synthesisTool = SynthesisFileMap.get(synthesisFile);

        let synthesisFactory : ISynthesisFactory | undefined;
        if(!synthesisTool)
        {
            return false;
        }
            synthesisFactory = SynthesisToolMap.get(synthesisTool);
        
        if(!synthesisFactory)
        {
            return false;
        }

        const existingProject : ISynthesisProject = synthesisFactory.CreateProject(projectName, projectPath, this.mContext);
        this.mSynthesisProjects.push(existingProject);

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
    private async HandleFileEvents() : Promise<void>
    {
        vscode.workspace.onDidCreateFiles((event) => 
        {
            const synthesisProjects = event.files.filter((file) => {
                const filePath = file.fsPath.toLowerCase();
                if (this.IsSynthesisProject(filePath))
                {
                    return file.fsPath;
                }
            }).map((file) => file.fsPath);

            synthesisProjects.forEach((projectPath) => {
                if(!this.mSynthesisProjects.find((synthesisProject) => {synthesisProject.GetPath() === projectPath;}))
                {
                    this.AddExistingProject(projectPath);
                }
            });
        });

        vscode.workspace.onDidDeleteFiles((event) => 
        {
            const synthesisProjects = event.files.filter((file) => {
                const filePath = file.fsPath.toLowerCase();
                if (this.IsSynthesisProject(filePath))
                {
                    return file.fsPath;
                }
            }).map((file) => file.fsPath);

            synthesisProjects.forEach((projectPath) => {
                const findIndex : number = this.mSynthesisProjects.findIndex((synthesisProject) => {synthesisProject.GetPath() === projectPath;});
                
                if(findIndex !== -1) { this.mSynthesisProjects.splice(findIndex, 1); }
            });
        });

        vscode.workspace.onDidRenameFiles((event) => 
        {
            const synthesisProjects = event.files.filter((file) => {
                const newFilePath = file.newUri.fsPath.toLowerCase();
                const oldFilePath = file.oldUri.fsPath.toLowerCase();
                
                if(this.IsSynthesisProject(oldFilePath))
                {
                    return file;
                }
            })
            .map((file) => {
                return {
                  oldPath: file.oldUri.fsPath,
                  newPath: file.newUri.fsPath
                };
            });

            synthesisProjects.forEach((projectPath) => {
                const findIndex : number = this.mSynthesisProjects.findIndex((synthesisProject) => {synthesisProject.GetPath() === projectPath.oldPath;});
                
                if(findIndex !== -1) {
                    this.mSynthesisProjects.splice(findIndex, 1);
                    this.AddExistingProject(projectPath.newPath);
                }
            });
        });
    }

    private IsSynthesisProject(filePath : string) : boolean
    {
        const synthesisFileEndings = Object.values(eSynthesisFile);
        synthesisFileEndings.forEach((fileEnding) => {
            if(path.extname(filePath) === fileEnding)
            {
                return true;
            }
        });

        return false;
    }

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

        synthesisProjects.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

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