// specific imports
import { ISynthesisFactory } from "./Synthesis/Factory/SynthesisFactory";
import { SynthesisToolMap, eSynthesisTool } from "./Synthesis/SynthesisPackage";
import { tSynthesisProjectConfig } from "./Synthesis/SynthesisProject";

import { Hdl_element } from "colibri2/out/parser/common";
import { Vhdl_parser } from "colibri2/out/parser/ts_vhdl/parser";

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

    public async SelectTopLevelEntity() : Promise<string>
    {
        //Enter project location
        const TopLevelEntity = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: 'Select Top-Level-Entity'
        });

        // only parse file, if valid file was selected
        if (TopLevelEntity && TopLevelEntity[0] && TopLevelEntity[0].fsPath && TopLevelEntity[0].fsPath.endsWith(".vhd")) {

            let parser : Vhdl_parser = new Vhdl_parser();
            await parser.init();

            let doc = await vscode.workspace.openTextDocument(TopLevelEntity[0].fsPath);
            let text : string = await doc.getText();

            let EntityName : string;
            let VhdlFileInfo : Hdl_element;

            // return empty string, if parsed file is invalid
            if(!text)
            {
                return "";
            }

            VhdlFileInfo =  await parser.get_all(text,'--');
            return VhdlFileInfo.name;
        }

        // return empty string, if no valid file was selected
        return "";
    }


    public async SelectFamily() : Promise<string>
    {
        //Enter project location
        const TopLevelEntity = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: 'Select Top-Level-Entity'
        });

        // only parse file, if valid file was selected
        if (TopLevelEntity && TopLevelEntity[0] && TopLevelEntity[0].fsPath && TopLevelEntity[0].fsPath.endsWith(".vhd")) {

            let parser : Vhdl_parser = new Vhdl_parser();
            await parser.init();

            let doc = await vscode.workspace.openTextDocument(TopLevelEntity[0].fsPath);
            let text : string = await doc.getText();

            let EntityName : string;
            let VhdlFileInfo : Hdl_element;

            // return empty string, if parsed file is invalid
            if(!text)
            {
                return "";
            }

            VhdlFileInfo =  await parser.get_all(text,'--');
            return VhdlFileInfo.name;
        }

        // return empty string, if no valid file was selected
        return "";
    }

    public async SelectDevice() : Promise<string>
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

        vscode.window.showErrorMessage("Selected Synthesis-Tool is not available!");
        return undefined;
    }

}