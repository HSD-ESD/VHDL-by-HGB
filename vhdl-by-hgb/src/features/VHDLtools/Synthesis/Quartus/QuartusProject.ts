//Specific Imports
import { ISynthesisProject, SynthesisProject } from "../SynthesisProject";
import * as TclScripts from "../TclScripts";
import { QuartusScriptGenerator } from "../../../FileTools/FileGenerator/ScriptGenerator/QuartusScriptGenerator";
import { Quartus} from "./Quartus";

//General Imports
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export class QuartusProject extends SynthesisProject implements ISynthesisProject
{
    // --------------------------------------------
    // private members
    // --------------------------------------------
    private mQuartus : Quartus;
    private mTclScriptsFolder: string = "";

    // --------------------------------------------
    // public methods
    // --------------------------------------------
    public constructor(name : string, projectPath : string, outputChannel : vscode.OutputChannel, context : vscode.ExtensionContext)
    {
        // call constructor of base-class
        super(name, projectPath, outputChannel, context);

        //Quartus-Instance for using Quartus-Utility-Functions
        this.mQuartus = new Quartus(super.mOutputChannel, super.mContext);

        //When new Quartus-Project is created -> make directory for all Tcl-Scripts
        this.mTclScriptsFolder = path.join(super.mPath, TclScripts.Folder);
        if (!fs.existsSync(this.mTclScriptsFolder)) {
            fs.mkdirSync(this.mTclScriptsFolder);
        }
        
    }

    public async Generate() : Promise<boolean>
    {
        //create tcl-script for generating a Quartus-Project
        QuartusScriptGenerator.GenerateProject(this);

        //compute script-path
        const ScriptPath : string = path.join(this.mTclScriptsFolder, TclScripts.GenerateProject);

        //Run Tcl-Script for generating Project
        const IsSuccess : boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage("Creating Quartus-Project failed!");
            return false;
        }

        vscode.window.showInformationMessage('Quartus-Project was created successfully!');

        return true;
    }

    public async UpdateFiles() : Promise<boolean>
    {
        //TODO: Update Files with Tcl-Script
        
        //create tcl-script for updating files of a Quartus-Project
        QuartusScriptGenerator.GenerateUpdateFiles(this);

        //compute script-path
        const ScriptPath : string = path.join(this.mTclScriptsFolder, TclScripts.UpdateFiles);

        //Run Tcl-Script for updating files of a Quartus-Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage("Updating files in Quartus-Project failed!");
            return false;
        }

        vscode.window.showInformationMessage('Files in Quartus-Project were updated successfully!');
        return true;
    }

    public async LaunchGUI() : Promise<boolean>
    {
        //compute script-path
        const ScriptPath : string = path.join(this.mTclScriptsFolder, TclScripts.LaunchGUI);

        if (!fs.existsSync(ScriptPath)) {
            QuartusScriptGenerator.GenerateLaunchGUI(this);
        }

        //Run Tcl-Script for launching GUI
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage("Launching Quartus-Project failed!");
            return false;
        }

        return true;
    }

    public async Compile() : Promise<boolean>
    {
        //compute script-path
        const ScriptPath : string = path.join(this.mTclScriptsFolder, TclScripts.Compile);

        if (!fs.existsSync(ScriptPath)) {
            QuartusScriptGenerator.GenerateCompile(this);
        }

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage("Compiling Quartus-Project failed!");
            return false;
        }

        return true;
    }

    public async SetTopLevelEntity(entity : string) : Promise<boolean>
    {
        super.mTopLevelEntity = entity;

        //TODO: Update TopLevel-Entity with Tcl-Script

        return true;
    }

    public async SetFamily(family : string) : Promise<boolean>
    {
        super.mFamily = family;
        //TODO: Update family with Tcl-Script

        return true;
    }

    public async SetDevice(device : string) : Promise<boolean>
    {
        super.mDevice = device;
        //TODO: Update device with Tcl-Script

        return true;
    }
}
