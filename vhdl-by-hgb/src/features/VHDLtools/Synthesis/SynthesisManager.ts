//specific imports
import { SynthesisWizard } from "../SynthesisWizard";
import { ISynthesisFactory } from "./Factory/SynthesisFactory";
import { ISynthesisProject, tSynthesisProjectConfig } from "./SynthesisProject";

//general imports
import * as vscode from 'vscode';

export class SynthesisManager 
{
    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mSynthesisProjects : Array<ISynthesisProject>;
    private mWizard : SynthesisWizard;
    private mActiveProject! : ISynthesisProject;

    //vscode-members
    private mOutputChannel : vscode.OutputChannel;


    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    constructor()
    {
        this.mSynthesisProjects = new Array<ISynthesisProject>();
        this.mWizard = new SynthesisWizard();
        this.mOutputChannel = vscode.window.createOutputChannel('VHDLbyHGB:Synthesis');
    }

    public async AddNewProject() : Promise<boolean>
    {
        // ask user to set configuration for new synthesis-project
        let projectConfig : tSynthesisProjectConfig = await this.mWizard.Run();
        // check selected configuration for validity
        if(projectConfig.factory === undefined || projectConfig.folderPath.length === 0 || projectConfig.name.length === 0)
        {
            vscode.window.showErrorMessage("Synthesis-Project could not be generated!");
            return false;
        }

        //use factory of selected synthesis-tool to create a synthesis-project
        let newProject = projectConfig.factory.CreateProject(projectConfig.name, projectConfig.folderPath);
        //add generated project to container of all synthesis-projects
        this.mSynthesisProjects.push(newProject);
        return true;
    }

    public async AddExistingProjecct() : Promise<boolean>
    {

        return true;
    }

    public async UpdateFiles() : Promise<boolean>
    {
        // check, if a synthesis-project is selected
        if(!this.mActiveProject)
        {
            vscode.window.showErrorMessage("No Synthesis-Project selected for updating files!");
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
        }

        // ask user to select top-level-entity
        const EntityName : string = await this.mWizard.SelectTopLevelEntity();

        //check selected entity for validity
        if(EntityName.length === 0)
        {
            vscode.window.showErrorMessage("No valid TopLevelEntity chosen for selected Synthesis-Project!");
            return false;
        }

        // set TopLevelEntity for selected synthesis-project
        const IsSuccess : boolean = await this.mActiveProject.SetTopLevelEntity(EntityName);

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

}