//specific imports
import { SynthesisWizard } from "./SynthesisWizard";
import { ISynthesisProject, TSynthesisProjectConfig, TSynthesisProject } from "./SynthesisProject";
import { ACTIVE_SYNTHESIS_PROJECT, NO_SYNTHESIS_PROJECT, SynthesisFileMap, SynthesisToolMap, eSynthesisFile, eSynthesisTool } from "./SynthesisPackage";
import { VhdlEntity } from "../VhdlPackage";
import { ISynthesisFactory } from "./Factory/SynthesisFactory";

//general imports
import * as vscode from 'vscode';
import * as path from 'path';
import { SynthesisViewProvider } from "../../TreeView/Synthesis/SynthesisView";

export class SynthesisManager
{
    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mSynthesisProjects : Map<eSynthesisTool, Array<ISynthesisProject>>;

    private mWizard : SynthesisWizard;
    private mActiveProject : ISynthesisProject | undefined;

    private mWorkSpacePath : string;

    //vscode-members
    private mOutputChannel : vscode.OutputChannel;
    private mContext : vscode.ExtensionContext;
    private mStatusBarItem : vscode.StatusBarItem;

    private mSynthesisViewProvider : SynthesisViewProvider;


    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    constructor(workSpacePath : string, context : vscode.ExtensionContext)
    {
        //vs-code members
        this.mContext = context;
        this.mOutputChannel = vscode.window.createOutputChannel('VHDLbyHGB.Synthesis');
        this.mStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.mStatusBarItem.name = "Active Synthesis-Project";
        this.mStatusBarItem.command = "VHDLbyHGB.Synthesis.SetActiveProject";
        this.mStatusBarItem.tooltip = "VHDLbyHGB: Select HDL Synthesis-Project";
        this.mStatusBarItem.show();

        //custom-members
        this.mWorkSpacePath = workSpacePath;
        this.mSynthesisProjects = new Map<eSynthesisTool, Array<ISynthesisProject>>();
        this.mWizard = new SynthesisWizard(this.mWorkSpacePath);

        this.RegisterCommands();
        this.HandleFileEvents();

        this.mSynthesisViewProvider = new SynthesisViewProvider(this.mSynthesisProjects, this.mContext, this.mWorkSpacePath);
        vscode.window.createTreeView(
            'vhdlbyhgb-view-synthesis',{
                treeDataProvider : this.mSynthesisViewProvider
            }
        );
    }

    public async Initialize() : Promise<void>
    {
        await this.LoadSynthesisProjects();
        this.updateStatusBar();
    }

    public async AddNewProject() : Promise<boolean>
    {
        // ask user to set configuration for new synthesis-project
        let projectConfig : TSynthesisProjectConfig | undefined = await this.mWizard.Run();
        // check selected configuration for validity
        if(!projectConfig)
        {
            vscode.window.showErrorMessage("Synthesis-Project could not be generated!");
            return false;
        }

        //use factory of selected synthesis-tool to create a synthesis-project
        let newProject : ISynthesisProject = projectConfig.factory.CreateProject(projectConfig.name, projectConfig.folderPath, this.mContext);
        //Generate Project-Files
        newProject.Generate();

        if(!this.mSynthesisProjects.has(projectConfig.tool))
        {
            this.mSynthesisProjects.set(projectConfig.tool,[]);
        }

        //add generated project to container of all synthesis-projects
        this.mSynthesisProjects.get(projectConfig.tool)?.push(newProject);
        //set new Project as active project
        this.updateActiveSynthesisProject(newProject);

        return true;
    }

    public async AddExistingProject(projectFile : string) : Promise<boolean>
    {
        const fileName = path.basename(projectFile);
        const projectName = fileName.split('.')[0];
        const projectPath = path.dirname(projectFile);
        const synthesisFile = path.extname(projectFile) as eSynthesisFile;
        const synthesisTool = SynthesisFileMap.get(synthesisFile);

        if(!synthesisTool)
        {
            return false;
        }

        let synthesisFactory : ISynthesisFactory | undefined = SynthesisToolMap.get(synthesisTool);

        if(!synthesisFactory)
        {
            return false;
        }

        const existingProject : ISynthesisProject = synthesisFactory.CreateProject(projectName, projectPath, this.mContext);

        if(!this.mSynthesisProjects.has(synthesisTool))
        {
            this.mSynthesisProjects.set(synthesisTool,[]);
        }

        this.mSynthesisProjects.get(synthesisTool)?.push(existingProject);

        return true;
    }

    public async SetActiveProject() : Promise<boolean>
    {
        const selectedTool : eSynthesisTool |  undefined = await this.mWizard.SelectSynthesisTool();
        if (!selectedTool)
        {
            return false;
        }

        if(selectedTool as string === NO_SYNTHESIS_PROJECT)
        {
            this.updateActiveSynthesisProject(undefined);
            return true;
        }

        const synthesisProjects : ISynthesisProject[] | undefined = this.mSynthesisProjects.get(selectedTool);
        if(!synthesisProjects)
        {
            return false;
        }

        const selectedProject = await this.mWizard.SelectActiveProject(synthesisProjects);
        if(!selectedProject)
        {
            vscode.window.showErrorMessage("No Synthesis-Project selected!");
            return false;
        }

        this.updateActiveSynthesisProject(selectedProject);

        if(this.mActiveProject)
        {
            vscode.window.showInformationMessage(`Active Synthesis-Project: ${path.relative(this.mWorkSpacePath, this.mActiveProject.GetPath())}`);
        }

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


    public async SetTopLevel() : Promise<boolean>
    {
        // check, if a synthesis-project is selected
        if(!this.mActiveProject)
        {
            vscode.window.showErrorMessage("No Synthesis-Project selected for setting Top-Level-Entity!");
            return false;
        }

        // ask user to select top-level-entity
        const Entity : VhdlEntity = await this.mWizard.SelectTopLevel();

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
        const FamilyName : string | undefined = await this.mWizard.SelectFamily();

        //check selected entity for validity
        if(!FamilyName)
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
        const DeviceName : string | undefined = await this.mWizard.SelectDevice();

        //check selected entity for validity
        if(!DeviceName)
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

    // public GetSynthesisProjects() : Array<ISynthesisProject> {

    //     return this.mSynthesisProjects;
    // }

    // public GetSpecificSynthesisProject(index : number) : ISynthesisProject{
    //     return this.mSynthesisProjects[index];
    // }



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

                const synthesisTool : eSynthesisTool | undefined = SynthesisFileMap.get(path.extname(projectPath) as eSynthesisFile);

                if(!synthesisTool) { return; }

                const synthesisProjects : ISynthesisProject[] | undefined = this.mSynthesisProjects.get(synthesisTool);

                if(!synthesisProjects) { return; }

                if(!synthesisProjects.find((synthesisProject) => {synthesisProject.GetPath() === projectPath;}))
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

                const synthesisTool : eSynthesisTool | undefined = SynthesisFileMap.get(path.extname(projectPath) as eSynthesisFile);

                if(!synthesisTool) { return; }

                const synthesisProjects : ISynthesisProject[] | undefined = this.mSynthesisProjects.get(synthesisTool);

                if(!synthesisProjects) { return; }

                const findIndex : number = synthesisProjects.findIndex((synthesisProject) => {synthesisProject.GetPath() === projectPath;});

                if(findIndex !== -1) { synthesisProjects.splice(findIndex, 1); }
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

                const synthesisTool : eSynthesisTool | undefined = SynthesisFileMap.get(path.extname(projectPath.newPath) as eSynthesisFile);

                if(!synthesisTool) { return; }

                const synthesisProjects : ISynthesisProject[] | undefined = this.mSynthesisProjects.get(synthesisTool);

                if(!synthesisProjects) { return; }

                const findIndex : number = synthesisProjects.findIndex((synthesisProject) => {synthesisProject.GetPath() === projectPath.oldPath;});

                if(findIndex !== -1) {
                    synthesisProjects.splice(findIndex, 1);
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

        this.loadActiveSynthesisProject();
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

    private saveActiveSynthesisProject(): void {

        if(!this.mActiveProject)
        {
            this.mContext.workspaceState.update(ACTIVE_SYNTHESIS_PROJECT, undefined);
            return;
        }

        const activeSynthesisProject : TSynthesisProject = {
            tool : this.mActiveProject.GetTool(),
            file : this.mActiveProject.GetPath()
        };

        this.mContext.workspaceState.update(ACTIVE_SYNTHESIS_PROJECT, activeSynthesisProject);
    }

    private loadActiveSynthesisProject(): void {

        const activeSynthesisProject : TSynthesisProject | undefined = this.mContext.workspaceState.get(ACTIVE_SYNTHESIS_PROJECT);

        if(!activeSynthesisProject) { return; }

        const projects = this.mSynthesisProjects.get(activeSynthesisProject.tool);

        if (!projects) { return; }

        const activeProject = projects.find( (project) => {
            return project.GetPath() === activeSynthesisProject.file;
        });

        if(!activeProject) { return; }

        this.mActiveProject = activeProject;
    }

    private updateActiveSynthesisProject(project : ISynthesisProject | undefined) : void
    {
        this.mActiveProject = project;
        this.saveActiveSynthesisProject();
        this.updateStatusBar();
    }

    private updateStatusBar(): void {
        if(!this.mActiveProject) {
            this.mStatusBarItem.text = NO_SYNTHESIS_PROJECT;
            return;
        }

        this.mStatusBarItem.text = this.mActiveProject.GetName();
    }

    private RegisterCommands(): void {

        let disposable: vscode.Disposable;

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Synthesis.View.Refresh", () => { this.mSynthesisViewProvider.refresh(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Synthesis.AddNewProject", () => { this.AddNewProject(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Synthesis.SetActiveProject", () => { this.SetActiveProject(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Synthesis.UpdateFiles", () => { this.UpdateFiles(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Synthesis.Compile", () => { this.Compile(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Synthesis.LaunchGUI", () => { this.LaunchGUI(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Synthesis.SetTopLevel", () => { this.SetTopLevel(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Synthesis.SetDevice", () => { this.SetDevice(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Synthesis.SetFamily", () => { this.SetFamily(); });
        this.mContext.subscriptions.push(disposable);

    }





}