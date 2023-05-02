//Specific Imports
import { ISynthesisProject, SynthesisProject } from "../SynthesisProject";
import * as TclScripts from "../TclScripts";
import { TclGenerator } from "../../../FileTools/FileGenerator/TclGenerator";
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
    private mTclGenerator: TclGenerator;


    // --------------------------------------------
    // public methods
    // --------------------------------------------
    public constructor(name : string, projectPath : string, outputChannel : vscode.OutputChannel)
    {
        super(name, projectPath, outputChannel);
        
        //When new Quartus-Project is created -> make directory for all Tcl-Scripts
        this.mTclScriptsFolder = path.join(super.mPath, TclScripts.Folder);
        if (!fs.existsSync(this.mTclScriptsFolder)) {
            fs.mkdirSync(this.mTclScriptsFolder);
        }

        //create tcl-script
        this.mQuartus = new Quartus()
        this.mTclGenerator = new TclGenerator();
        this.mTclGenerator.GenerateQuartusProject(this);

        //Run Tcl-Script for generating Project
        let IsSuccess : boolean = true;


        Quartus.getInstance().then(quartus => {
            quartus.RunTclScript(TclScripts.GenerateProject);
        });


        if (!IsSuccess) {
            vscode.window.showErrorMessage("Creating Quartus-Project failed!");
            return false;
        }

        vscode.window.showInformationMessage('Quartus-Project was created successfully!');
        
    }

    public UpdateFiles() : boolean
    {
        return true;
    }

    public LaunchGUI() : void
    {
        
    }

    public Compile() : boolean
    {
        return true;
    }

    public SetTopLevelEntity(entity : string) : boolean
    {
        return true;
    }

    public SetFamily(family : string) : boolean
    {
        return true;
    }

    public SetDevice(device : string) : boolean
    {
        return true;
    }
}
