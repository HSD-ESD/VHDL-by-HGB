//Specific Imports
import { ISynthesisProject, SynthesisProject } from "../SynthesisProject";
import * as TclScripts from "../TclScripts";
import { TclGenerator } from "../../../FileTools/FileGenerator/ScriptGenerator/QuartusScriptGenerator";
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
    private mTclGenerator: TclGenerator;

    private mTclScriptsFolder: string = "";


    // --------------------------------------------
    // public methods
    // --------------------------------------------
    public constructor(name : string, projectPath : string, outputChannel : vscode.OutputChannel, context : vscode.ExtensionContext)
    {
        // call constructor of base-class
        super(name, projectPath, outputChannel, context);

        this.mQuartus = new Quartus(super.mOutputChannel, super.mContext);
        this.mTclGenerator = new TclGenerator();

        //When new Quartus-Project is created -> make directory for all Tcl-Scripts
        this.mTclScriptsFolder = path.join(super.mPath, TclScripts.Folder);
        if (!fs.existsSync(this.mTclScriptsFolder)) {
            fs.mkdirSync(this.mTclScriptsFolder);
        }

        //create tcl-script
        this.mTclGenerator.GenerateQuartusProject(this);

        let IsSuccess : boolean = true;

        //Run Tcl-Script for generating Project
         this.mQuartus.RunTclScript(TclScripts.GenerateProject);


        if (!IsSuccess) {
            vscode.window.showErrorMessage("Creating Quartus-Project failed!");
            return false;
        }

        vscode.window.showInformationMessage('Quartus-Project was created successfully!');
        
    }

    public UpdateFiles() : boolean
    {
        //TODO: Update Files with Tcl-Script
        // 

        return true;
    }

    public LaunchGUI() : void
    {
        //TODO: Launch GUI with Tcl
    }

    public Compile() : boolean
    {
        //TODO: Compile Project with Tcl

        return true;
    }

    public SetTopLevelEntity(entity : string) : boolean
    {
        super.mTopLevelEntity = entity;

        //TODO: Update TopLevel-Entity with Tcl-Script

        return true;
    }

    public SetFamily(family : string) : boolean
    {
        super.mFamily = family;
        //TODO: Update family with Tcl-Script

        return true;
    }

    public SetDevice(device : string) : boolean
    {
        super.mDevice = device;
        //TODO: Update device with Tcl-Script

        return true;
    }
}
