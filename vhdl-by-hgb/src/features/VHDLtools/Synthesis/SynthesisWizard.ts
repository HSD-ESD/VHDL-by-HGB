
// specific imports
import { VhdlEntity } from "../VhdlPackage";
import { ISynthesisFactory } from "./Factory/SynthesisFactory";
import { SynthesisToolMap, eSynthesisTool } from "./SynthesisPackage";
import { TSynthesisProjectConfig } from "./SynthesisProject";

import { HDLUtils } from "../../FileTools/HDLUtils";

// general imports
import * as vscode from 'vscode';
import * as path from 'path';

// module-internal constants
const cEntityNameExtractor : RegExp = /\'([^\']+)\'/;

export class SynthesisWizard {

    // --------------------------------------------
    // private members
    // --------------------------------------------
    public async Run() : Promise<TSynthesisProjectConfig>
    {
        let config : TSynthesisProjectConfig = new TSynthesisProjectConfig();

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

    public async SelectActiveProject(projects : ISynthesisProject[]) : Promise<ISynthesisProject | undefined>
    {
        const projectPaths : string[] = projects.map((project) => {
            return path.relative(this.mWorkSpacePath, project.GetPath());
        });

        const selectedProjectPath = await vscode.window.showQuickPick(projectPaths, {
            placeHolder: 'Select Synthesis-Project',
        });
        
        if (!selectedProjectPath) 
        {
            return undefined;
        }

        const selectedProject : ISynthesisProject | undefined = projects.find(project => project.GetPath() === path.resolve(this.mWorkSpacePath, selectedProjectPath));

        return selectedProject;
    }

    public async SelectTopLevelEntity() : Promise<VhdlEntity>
    {
        let entity : VhdlEntity = new VhdlEntity();

        //Enter project location
        const TopLevelEntity = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: 'Select Top-Level-Entity'
        });

        // only parse file, if valid file was selected
        if (TopLevelEntity && TopLevelEntity[0] && TopLevelEntity[0].fsPath && TopLevelEntity[0].fsPath.endsWith(".vhd")) {

            // get all document-symbols from a file
            const docSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                vscode.Uri.file(TopLevelEntity[0].fsPath)
            );

            // find entity-definition in file
            const entitySymbol = docSymbols.find(symbol =>
                symbol.kind === vscode.SymbolKind.Module 
            );

            //set filepath for entity
            entity.mPath = TopLevelEntity[0].fsPath;

            if(entitySymbol)
            {
                let entityString : string = entitySymbol.name;
                let entityMatch = cEntityNameExtractor.exec(entityString);
                
                if (entityMatch)
                {   
                    entity.mName = entityMatch[1];
                }
            }
        }

        // return filled entity
        return entity;
    }


    public async SelectFamily() : Promise<string>
    {
        // enter project name
        let familyName : string | undefined =   await vscode.window.showInputBox({
                                                    prompt: "Enter Family-Name",
                                                    placeHolder: "Family",
                                                });

        if(familyName) 
        {
            return familyName;
        }
        else
        {
            return "";
        }
    }

    public async SelectDevice() : Promise<string>
    {
        // enter project name
        let deviceName : string | undefined =   await vscode.window.showInputBox({
                                                    prompt: "Enter Device-Name",
                                                    placeHolder: "Device",
                                                });

        if(deviceName) 
        {
            return deviceName;
        }
        else
        {
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
            openLabel: 'Select Project-Folder'
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
            let selectedFactory =  SynthesisToolMap.get(selectedTool as eSynthesisTool);
            if(selectedFactory)
            {
                return selectedFactory;
            }
        }

        vscode.window.showErrorMessage("Selected Synthesis-Tool is not available!");
        return undefined;
    }

}