// specific imports
import { ISynthesisFactory } from "./Synthesis/Factory/SynthesisFactory";
import { SynthesisToolMap, eSynthesisTool } from "./Synthesis/SynthesisPackage";
import { tSynthesisProjectConfig } from "./Synthesis/SynthesisProject";

// general imports
import * as vscode from 'vscode';


export class SynthesisWizard {

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public async Run() : Promise<tSynthesisProjectConfig>
    {
        let config : tSynthesisProjectConfig = new tSynthesisProjectConfig();

        //select synthesis-Tool
        let synthesisTool = await this.SelectSynthesisTool();
        if (synthesisTool) {config.factory = synthesisTool;}
        else { vscode.window.showWarningMessage("No Synthesis-Tool selected!"); return config;}

        //select project-name
        config.name = await this.SelectProjectName();

        //select project-folder
        config.folderPath = await this.SelectProjectPath();

        return config;
    }


    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private async SelectProjectName() : Promise<string>
    {
        // enter project name
        let projectName : string | undefined =  await vscode.window.showInputBox({
                                                    prompt: "Enter Project-Name",
                                                    placeHolder: "MyProject",
                                                });

        if(projectName) 
        {
            return projectName;
        }
        else
        {
            vscode.window.showInformationMessage('No valid Project-Name!');
            return "";
        }
    }

    private async SelectProjectPath() : Promise<string>
    {
        //Enter project location
        const projectPath = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Quartus-Project-Folder'
        });

        if (projectPath && projectPath[0] && projectPath[0].fsPath)
        {
            //chosen path is valid
            vscode.window.showInformationMessage('Project-Location was set successfully!');
            return projectPath[0].fsPath;
        }
        else
        {
            vscode.window.showInformationMessage('No valid Project-Location!');
            return "";
        }
    }

    private async SelectSynthesisTool() : Promise<ISynthesisFactory | undefined>
    {
        // quick pick menu with available tools
        let selectedTool = await vscode.window.showQuickPick(Object.values(eSynthesisTool));

        if(selectedTool)
        {
            let selectedFactory =  SynthesisToolMap.get(selectedTool);
            if(selectedFactory)
            {
                return selectedFactory;
            }
        }
        
        return undefined;
    }

}