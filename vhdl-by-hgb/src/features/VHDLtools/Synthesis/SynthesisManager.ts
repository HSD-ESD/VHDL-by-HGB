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

    public async AddProject() : Promise<boolean>
    {
        let projectConfig : tSynthesisProjectConfig = await this.mWizard.Run();
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


}