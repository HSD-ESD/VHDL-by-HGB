
// general imports
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// specific imports
import { ISynthesisProject, SynthesisProject } from "../SynthesisProject";
import { VhdlEntity } from '../../VhdlPackage';
import { eSynthesisFile, eSynthesisTool } from '../SynthesisPackage';
import {CustomDiamondTclScriptsFolder,
        DiamondLdf,
        DiamondProjectManipulationCommand as DiamondProjectManipulationCommand, 
        DiamondProjectSourceCommand} from './diamond_package';
import { Diamond } from './diamond';
import { DiamondScriptGenerator } from './diamond_script_generator';
import { HDLUtils } from '../../../FileTools/HDLUtils';

//--------------------------------------------------------------
//module-internal types
//--------------------------------------------------------------
enum eExecutionMode {
    script,
    command
}

//--------------------------------------------------------------
//module-internal constants
//--------------------------------------------------------------


// Lattice-Diamond-Project
export class DiamondProject extends SynthesisProject implements ISynthesisProject
{ 
    // --------------------------------------------
    // private members
    // --------------------------------------------

    private mLDF : DiamondLdf;
    private mTclScriptsFolder: string;

    //vscode-members
    private mOutputChannel : vscode.OutputChannel;
    private mContext : vscode.ExtensionContext;
    private mLdfWatcher : vscode.FileSystemWatcher;

    // --------------------------------------------
    // public methods
    // --------------------------------------------
    public constructor(name : string, projectPath : string, context : vscode.ExtensionContext)
    {
        // call constructor of base-class
        super(name, projectPath);

        //init vscode-members
        this.mContext = context;
        this.mOutputChannel = vscode.window.createOutputChannel(`VHDLbyHGB.Diamond.${name}`);

        //init project-specific members
        const ldfPath = path.join(this.mFolderPath, this.mName + eSynthesisFile.Diamond);
        this.mLDF = new DiamondLdf(ldfPath);
        this.mLdfWatcher = vscode.workspace.createFileSystemWatcher(this.mLDF.Path);

        //When new project is created -> make directory for all Tcl-Scripts
        this.mTclScriptsFolder = path.join(this.mFolderPath, CustomDiamondTclScriptsFolder);
        if (!fs.existsSync(this.mTclScriptsFolder)) {
            fs.mkdirSync(this.mTclScriptsFolder);
        }
        
    }

    public async Generate(): Promise<boolean> 
    {
        const executionMode : eExecutionMode = eExecutionMode.command;

        if (executionMode === eExecutionMode.command) 
        {
            const scriptPath = DiamondScriptGenerator.GenerateProject(this);

            if (!scriptPath)
            {
                vscode.window.showErrorMessage(`Creating Diamond-Project "${this.mName}" failed!`);
                return false;
            }

            //Run Tcl-Script for generating Project
            const IsSuccess : boolean = await Diamond.RunTclScriptGUI(scriptPath, this.mFolderPath, this.mOutputChannel);

            DiamondScriptGenerator.DeleteScript(scriptPath);

            if (!IsSuccess) {
                vscode.window.showErrorMessage(`Creating Diamond-Project "${this.mName}" failed!`);
                return false;
            }

        }
        else
        {
            const tclCommands : string[] = [];

            // add commands
            const newProject = DiamondProjectManipulationCommand.new + " -name \"" + this.mName + "\" -impl \"" + this.mName + "\"";
            tclCommands.push(newProject);

            const IsSuccess : boolean = await Diamond.RunTclCommands(tclCommands, this.mFolderPath, this.mOutputChannel);

            if (!IsSuccess) {
                vscode.window.showErrorMessage(`Creating Diamond-Project "${this.mName}" failed!`);
                return false;
            }

        }
        
        vscode.window.showInformationMessage(`Diamond-Project "${this.mName}" was created successfully!`);

        return true;
    }

    public async UpdateFiles(): Promise<boolean> 
    {
        if(!this.mLDF.TopLevel.mPath || this.mLDF.TopLevel.mPath.length === 0)
        {
            const symbolInfo = await HDLUtils.GetSymbolInformation(this.mLDF.TopLevel.mName);
            if(!symbolInfo[0])
            {
                vscode.window.showErrorMessage(`TopLevelEntity required for updating files of Quartus-Project "${this.mName}"!`);
                return false;
            }

            this.mLDF.TopLevel.mPath = symbolInfo[0].location.uri.fsPath;
        }

        const files : Set<string> = await HDLUtils.GetDependencies(this.mLDF.TopLevel.mPath);
        this.mLDF.VhdlFiles = Array.from(files);

        let executionMode : eExecutionMode = eExecutionMode.script;

        switch (executionMode) {
            case eExecutionMode.script:
            {
                const scriptPath = DiamondScriptGenerator.GenerateUpdateFiles(this);

                if (!scriptPath)
                {
                    vscode.window.showErrorMessage(`Updating files in Diamond-Project "${this.mName}" failed!`);
                    return false;
                }

                const IsSuccess : boolean = await Diamond.RunTclScript(scriptPath, this.mFolderPath, this.mOutputChannel);

                DiamondScriptGenerator.DeleteScript(scriptPath);

                if (!IsSuccess) {
                    vscode.window.showErrorMessage(`Updating files in Diamond-Project "${this.mName}" failed!`);
                    return false;
                }    

                break;
            }
            default:
            {
                const tclCommands : string[] = [];
                
                const adjustedProjectPath = this.mLDF.Path.replace(/\\/g, "/");
                const openProjectCmd : string = `${DiamondProjectManipulationCommand.open} \"${adjustedProjectPath}\"\n`;
                tclCommands.push(openProjectCmd);
                
                // add commands
                for (const file of this.mLDF.VhdlFiles) 
                {
                    const adjustedFilePath = file.replace(/\\/g, "/");
                    const addFileCmd : string = `${DiamondProjectSourceCommand.add} \"${adjustedFilePath}\"\n`;
                    tclCommands.push(addFileCmd);    
                }

                const closeProjectCmd : string = `${DiamondProjectManipulationCommand.close}\n`;
                tclCommands.push(closeProjectCmd);        

                const IsSuccess : boolean = await Diamond.RunTclCommands(tclCommands, this.mFolderPath, this.mOutputChannel);

                if (!IsSuccess) {
                    vscode.window.showErrorMessage(`Updating files in Diamond-Project "${this.mName}" failed!`);
                    return false;
                }

                break;
            }
        }        

        vscode.window.showInformationMessage(`Files for Diamond-Project "${this.mName}" were updated successfully!`);

        return true;
    }

    public async LaunchGUI(): Promise<boolean> 
    {
        
        const scriptPath = DiamondScriptGenerator.GenerateLaunchGUI(this);

        if (!scriptPath)
        {
            vscode.window.showErrorMessage(`Launching Diamond-Project "${this.mName}" failed!`);
            return false;
        }

        const IsSuccess : boolean = await Diamond.RunTclScriptGUI(scriptPath, this.mFolderPath, this.mOutputChannel);

        DiamondScriptGenerator.DeleteScript(scriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Launching Diamond-Project "${this.mName}" failed!`);
            return false;
        }

        return true;
    }

    public async Compile(): Promise<boolean> 
    {
        const scriptPath = DiamondScriptGenerator.GenerateCompile(this);

        if (!scriptPath)
        {
            vscode.window.showErrorMessage(`Compiling Diamond-Project "${this.mName}" failed!`);
            return false;
        }

        const IsSuccess : boolean = await Diamond.RunTclScript(scriptPath, this.mFolderPath, this.mOutputChannel);

        DiamondScriptGenerator.DeleteScript(scriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Compiling Diamond-Project "${this.mName}" failed!`);
            return false;
        }

        return true;
    }
    public async SetTopLevel(entity: VhdlEntity): Promise<boolean> 
    {
        this.mLDF.TopLevel = entity;

        const scriptPath = DiamondScriptGenerator.GenerateTopLevel(this);

        if (!scriptPath)
        {
            vscode.window.showErrorMessage(`Setting TopLevelEntity for Diamond-Project "${this.mName}" failed!`);
            return false;
        }

        const IsSuccess : boolean = await Diamond.RunTclScript(scriptPath, this.mFolderPath, this.mOutputChannel);

        DiamondScriptGenerator.DeleteScript(scriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Setting TopLevelEntity for Diamond-Project "${this.mName}" failed!`);
            return false;
        }

        return true;
    }
    public async SetFamily(family: string): Promise<boolean> 
    {
        this.mLDF.Family = family;

        const scriptPath = DiamondScriptGenerator.GenerateFamily(this);

        if (!scriptPath)
        {
            vscode.window.showErrorMessage(`Setting Family for Diamond-Project "${this.mName}" failed!`);
            return false;
        }

        const IsSuccess : boolean = await Diamond.RunTclScript(scriptPath, this.mFolderPath, this.mOutputChannel);

        DiamondScriptGenerator.DeleteScript(scriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Setting Family for Diamond-Project "${this.mName}" failed!`);
            return false;
        }

        return true;
    }
    public async SetDevice(device: string): Promise<boolean> 
    {
        this.mLDF.Device = device;

        const scriptPath = DiamondScriptGenerator.GenerateDevice(this);

        if (!scriptPath)
        {
            vscode.window.showErrorMessage(`Setting Device for Diamond-Project "${this.mName}" failed!`);
            return false;
        }

        const IsSuccess : boolean = await Diamond.RunTclScript(scriptPath, this.mFolderPath, this.mOutputChannel);

        DiamondScriptGenerator.DeleteScript(scriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Setting Device for Diamond-Project "${this.mName}" failed!`);
            return false;
        }

        return true;
    }
    public GetName(): string {
        return this.mName;
    }
    public GetPath(): string {
        return this.mLDF.Path;
    }
    public GetTopLevel() : VhdlEntity {
        return this.mLDF.TopLevel;
    }
    public GetDevice(): string {
        return this.mLDF.Device;
    }
    public GetFamily(): string {
        return this.mLDF.Family;
    }
    public GetFiles(): string[] {
        return this.mLDF.VhdlFiles;
    }
    public GetTool(): eSynthesisTool {
        return eSynthesisTool.Diamond;
    }

    // other public functions
    GetFolderPath() : string
    {
        return this.mFolderPath;
    }

    public GetTclScriptsFolder() : string { return this.mTclScriptsFolder; }

    public GetLdf() : DiamondLdf { return this.mLDF; }

    // --------------------------------------------
    // private methods
    // --------------------------------------------
    private async Update() : Promise<void>
    {
        this.mLDF = Diamond.ParseLdf(this.mLDF.Path);
    }

    private async HandleFileEvents() : Promise<void>
    {
        this.mLdfWatcher.onDidCreate((ldfFile) => 
        {
            this.Update();
        });

        this.mLdfWatcher.onDidChange((ldfFile) => 
        {
            this.Update();
        });

        // Start watching the workspace-folder
        const disposable = vscode.Disposable.from(this.mLdfWatcher);
        // Dispose the watcher when extension is not active
        this.mContext.subscriptions.push(disposable);
    }
    
}