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

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    constructor()
    {
        this.mSynthesisProjects = new Array<ISynthesisProject>();
        this.mWizard = new SynthesisWizard();
    }

    public async AddProject() : Promise<boolean>
    {
        let projectConfig : tSynthesisProjectConfig = await this.mWizard.Run();
        if(projectConfig.factory === undefined || projectConfig.folderPath.length === 0 || projectConfig.name.length === 0)
        {
            vscode.window.showErrorMessage("Synthesis-Project could not be generated!");
            return false;
        }

        let newProject = projectConfig.factory.CreateProject(projectConfig.name, projectConfig.folderPath);
        this.mSynthesisProjects.push(newProject);
        return true;
    }


}