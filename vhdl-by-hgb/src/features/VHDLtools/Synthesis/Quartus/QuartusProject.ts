//Specific Imports
import { ISynthesisProject, SynthesisProject } from "../SynthesisProject";
import * as TclScripts from "../TclScripts";
import { QuartusScriptGenerator } from "../../../FileTools/FileGenerator/ScriptGenerator/QuartusScriptGenerator";
import { Quartus} from "./Quartus";

//General Imports
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { FileHolder } from "../../../FileTools/FileHolder";

export class QuartusProject extends SynthesisProject implements ISynthesisProject
{
    // --------------------------------------------
    // private members
    // --------------------------------------------
    private mQuartus : Quartus;
    private mTclScriptsFolder: string;
    private mFileHolder : FileHolder;

    // --------------------------------------------
    // public methods
    // --------------------------------------------
    public constructor(name : string, projectPath : string, outputChannel : vscode.OutputChannel, context : vscode.ExtensionContext, fileHolder : FileHolder)
    {
        // call constructor of base-class
        super(name, projectPath, outputChannel, context);

        this.mFileHolder = fileHolder;

        //Quartus-Instance for using Quartus-Utility-Functions
        this.mQuartus = new Quartus(this.mOutputChannel, this.mContext);

        //When new Quartus-Project is created -> make directory for all Tcl-Scripts
        this.mTclScriptsFolder = path.join(this.mPath, TclScripts.Folder);
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
            //create tcl-script for launching a Quartus-Project
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
            //create tcl-script for compiling a Quartus-Project
            QuartusScriptGenerator.GenerateCompile(this);
        }

        //inform user about compiling
        vscode.window.showInformationMessage(`Quartus-Project: ${this.mName} -> compiling started...`);

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage("Compiling Quartus-Project failed!");
            return false;
        }

        //inform user about compiling
        vscode.window.showInformationMessage(`Quartus-Project: ${this.mName} -> compiling finished...`);

        return true;
    }

    public async SetTopLevelEntity(entity : string) : Promise<boolean>
    {
        this.mTopLevelEntity = entity;

        //create tcl-script for setting TopLevelEntity of a Quartus-Project
        QuartusScriptGenerator.GenerateTopLevelEntity(this);

        //compute script-path
        const ScriptPath : string = path.join(this.mTclScriptsFolder, TclScripts.TopLevelEntity);

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage("Setting TopLevelEntity for Quartus-Project failed!");
            return false;
        }

        return true;
    }

    public async SetFamily(family : string) : Promise<boolean>
    {
        this.mFamily = family;

        //create tcl-script for setting Family of a Quartus-Project
        QuartusScriptGenerator.GenerateFamily(this);

        //compute script-path
        const ScriptPath : string = path.join(this.mTclScriptsFolder, TclScripts.Family);

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage("Setting Family for Quartus-Project failed!");
            return false;
        }

        return true;
    }

    public async SetDevice(device : string) : Promise<boolean>
    {
        this.mDevice = device;

        //create tcl-script for setting Device of a Quartus-Project
        QuartusScriptGenerator.GenerateDevice(this);

        //compute script-path
        const ScriptPath : string = path.join(this.mTclScriptsFolder, TclScripts.Device);

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage("Setting Device for Quartus-Project failed!");
            return false;
        }

        return true;
    }

    //Getter-Methods
    public GetName() : string { return this.mName; }

    public GetTclScriptsFolder() : string { return this.mTclScriptsFolder; }

    public GetPath() : string { return this.mPath; }

    public GetQuartus() : Quartus { return this.mQuartus; }

    public GetTopLevelEntity() : string { return this.mTopLevelEntity; }

    public GetDevice() : string { return this.mDevice; }

    public GetFamily() : string { return this.mFamily; }

    public GetFileHolder() : FileHolder { return this.mFileHolder; }


}
