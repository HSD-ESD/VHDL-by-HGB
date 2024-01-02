
// specific imports
import { VhdlEntity } from "../vhdl_package";
import { ISynthesisFactory } from "./factory/synthesis_factory";
import { EnabledSynthesisTools, NO_SYNTHESIS_PROJECT, SynthesisToolMap, eSynthesisTool } from "./synthesis_package";
import { ISynthesisProject, TSynthesisProjectConfig } from "./synthesis_project";

// general imports
import * as vscode from 'vscode';
import * as path from 'path';

// module-internal constants
const cEntityNameExtractor : RegExp = /\'([^\']+)\'/;

export class SynthesisWizard {

    // --------------------------------------------
    // private members
    // --------------------------------------------
    private mWorkSpacePath : string;

    // --------------------------------------------
    // public methods
    // --------------------------------------------
    public constructor(workSpacePath : string)
    {
        this.mWorkSpacePath = workSpacePath;
    }

    public async Run() : Promise<TSynthesisProjectConfig | undefined>
    {
        let config : TSynthesisProjectConfig = new TSynthesisProjectConfig();

        //select synthesis-Tool
        let synthesisTool = await this.SelectSynthesisTool();
        if(!synthesisTool)
        {
            return undefined;
        }
        config.tool = synthesisTool;

        // select factory corresponding to synthesis-tool
        let selectedFactory =  SynthesisToolMap.get(synthesisTool);
        if(!selectedFactory)
        {
            return undefined;
        }
        config.factory = selectedFactory;

        //select project-name
        let projectName = await this.SelectProjectName();
        if(!projectName)
        {
            return undefined;
        }
        config.name = projectName;

        //select project-folder
        let projectPath = await this.SelectProjectPath();
        if(!projectPath)
        {
            return undefined;
        }
        config.folderPath = projectPath;

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

    public async SelectTopLevel() : Promise<VhdlEntity>
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


    public async SelectFamily() : Promise<string | undefined>
    {
        // enter project name
        let familyName : string | undefined =   await vscode.window.showInputBox({
                                                    prompt: "Enter Family-Name",
                                                    placeHolder: "Family",
                                                });

        return familyName;
    }

    public async SelectDevice() : Promise<string | undefined>
    {
        // enter project name
        let deviceName : string | undefined =   await vscode.window.showInputBox({
                                                    prompt: "Enter Device-Name",
                                                    placeHolder: "Device",
                                                });

        return deviceName;
    }

    public async SelectSynthesisTool() : Promise<eSynthesisTool | undefined>
    {
        // quick pick menu with available tools:
        // provide additional explicit option for No synthesis-project, as putting it in the enum itself would not be clean. 
        let selectedTool = await vscode.window.showQuickPick([...EnabledSynthesisTools, NO_SYNTHESIS_PROJECT]);

        if (!selectedTool)
        {
            vscode.window.showErrorMessage("Selected Synthesis-Tool is not available!");
            return undefined;
        }

        return selectedTool as eSynthesisTool;
    }

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private async SelectProjectName() : Promise<string | undefined>
    {
        // enter project name
        let projectName : string | undefined =  await vscode.window.showInputBox({
                                                    prompt: "Enter Project-Name",
                                                    placeHolder: "MyProject",
                                                });

        if(!projectName) 
        {
            vscode.window.showInformationMessage('No valid Project-Name!');
            return undefined;
        }

        return projectName;
    }

    private async SelectProjectPath() : Promise<string | undefined>
    {
        //Enter project location
        const projectPath = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Project-Folder'
        });

        if (!(projectPath && projectPath[0] && projectPath[0].fsPath))
        {
            vscode.window.showInformationMessage('No valid Project-Location!');
            return undefined;
        }
        
        return projectPath[0].fsPath;
    }

}