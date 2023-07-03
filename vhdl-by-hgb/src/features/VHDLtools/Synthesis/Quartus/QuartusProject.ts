//Specific Imports
import { ISynthesisProject, SynthesisProject } from "../SynthesisProject";
import * as TclScripts from "../TclScripts";
import { QuartusScriptGenerator } from "../../../FileTools/FileGenerator/ScriptGenerator/QuartusScriptGenerator";
import { Quartus} from "./Quartus";

//General Imports
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { VhdlEntity } from "../../../VhdlDefinitions";
import { HDLUtils } from "../../../FileTools/HDLUtils";
import { QuartusQsf} from "./QuartusPackage";
import { eSynthesisFile } from "../SynthesisPackage";

export class QuartusProject extends SynthesisProject implements ISynthesisProject
{
    // --------------------------------------------
    // private members
    // --------------------------------------------
    private mQuartus : Quartus;
    private mTclScriptsFolder: string;
    private mFileHolder : FileHolder;
    private mFolderWatcher : vscode.FileSystemWatcher;

    // --------------------------------------------
    // public methods
    // --------------------------------------------
    public constructor(name : string, projectPath : string, context : vscode.ExtensionContext)
    {
        // call constructor of base-class
        super(name, projectPath);

        //init vscode-members
        this.mContext = context;
        this.mOutputChannel = vscode.window.createOutputChannel(`VHDLbyHGB.Quartus.${name}`);

        //Quartus-Instance for using Quartus-Utility-Functions
        this.mQuartus = new Quartus(this.mOutputChannel, this.mContext);
        this.mQSF = new QuartusQsf();

        //When new Quartus-Project is created -> make directory for all Tcl-Scripts
        this.mTclScriptsFolder = path.join(this.mFolderPath, TclScripts.Folder);
        if (!fs.existsSync(this.mTclScriptsFolder)) {
            fs.mkdirSync(this.mTclScriptsFolder);
        }

        this.mFolderWatcher = vscode.workspace.createFileSystemWatcher(path.join(this.mPath, `${this.mName}${eSynthesisFile.Quartus}`));
        this.HandleFileEvents();
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
            vscode.window.showErrorMessage(`Creating Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        vscode.window.showInformationMessage(`Quartus-Project "${this.mName}" was created successfully!`);

        return true;
    }

    public async UpdateFiles() : Promise<boolean>
    {   
        //create tcl-script for updating files of a Quartus-Project
        QuartusScriptGenerator.GenerateUpdateFiles(this);

        //compute script-path
        const ScriptPath : string = path.join(this.mTclScriptsFolder, TclScripts.UpdateFiles);

        //Run Tcl-Script for updating files of a Quartus-Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Updating files in Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        vscode.window.showInformationMessage(`Files for Quartus-Project "${this.mName}" were updated successfully!`);
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
            vscode.window.showErrorMessage(`Launching Quartus-Project "${this.mName}" failed!`);
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
        vscode.window.showInformationMessage(`Quartus-Project "${this.mName}" -> compiling started...`);
        this.mOutputChannel.show();

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Compiling Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        //inform user about compiling
        vscode.window.showInformationMessage(`Quartus-Project "${this.mName}" -> compiling finished...`);

        return true;
    }

    public async SetTopLevel(entity : VhdlEntity) : Promise<boolean>
    {
        this.mQSF.TopLevelEntity = entity;

        //create tcl-script for setting TopLevelEntity of a Quartus-Project
        QuartusScriptGenerator.GenerateTopLevelEntity(this);

        //compute script-path
        const ScriptPath : string = path.join(this.mTclScriptsFolder, TclScripts.TopLevelEntity);

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Setting TopLevelEntity for Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        vscode.window.showInformationMessage(`TopLevelEntity "${this.mQSF.TopLevelEntity.mName}" for Quartus-Project "${this.mName}" was set successfully!`);

        return true;
    }

    public async SetFamily(family : string) : Promise<boolean>
    {
        this.mQSF.Family = family;

        //create tcl-script for setting Family of a Quartus-Project
        QuartusScriptGenerator.GenerateFamily(this);

        //compute script-path
        const ScriptPath : string = path.join(this.mTclScriptsFolder, TclScripts.Family);

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Setting Family for Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        vscode.window.showInformationMessage(`Family "${this.mQSF.Family}" for Quartus-Project "${this.mName}" was set successfully!`);

        return true;
    }

    public async SetDevice(device : string) : Promise<boolean>
    {
        this.mQSF.Device = device;

        //create tcl-script for setting Device of a Quartus-Project
        QuartusScriptGenerator.GenerateDevice(this);

        //compute script-path
        const ScriptPath : string = path.join(this.mTclScriptsFolder, TclScripts.Device);

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(ScriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Setting Device for Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        vscode.window.showInformationMessage(`Device "${this.mQSF.Device}" for Quartus-Project "${this.mName}" was set successfully!`);

        return true;
    }

    //Getter-Methods

    public GetName() : string { return this.mName; }

    public GetTopLevel() : VhdlEntity { return this.mQSF.TopLevelEntity; }

    public GetFamily() : string { return this.mQSF.Family; }

    public GetDevice() : string { return this.mQSF.Device; }

    public GetFiles() : string[] { return this.mQSF.VhdlFiles; }

    public GetTclScriptsFolder() : string { return this.mTclScriptsFolder; }

    public GetPath() : string { return this.mQSF.path; }

    public GetFolderPath() : string { return this.mFolderPath; }

    public GetQuartus() : Quartus { return this.mQuartus; }

    public GetQsf() : QuartusQsf { return this.mQSF; }

    // --------------------------------------------
    // private methods
    // --------------------------------------------
    private async Update() : Promise<void>
    {
        this.mQSF = await this.mQuartus.ParseQsf(this.mQSF.path);
    }

    private async HandleFileEvents() : Promise<void>
    {
        this.mQsfWatcher.onDidCreate((qsfFile) => 
        {
            this.Update();
        });

        this.mQsfWatcher.onDidChange((qsfFile) => 
        {
            this.Update();
        });
    }

    private HandleFileEvents() : void
    {        
        //handle events for FolderWatcher
        this.mFolderWatcher.onDidCreate( (uri) => {
            
        });
        this.mFolderWatcher.onDidChange( (uri) => {
            
        });

        // Start watching the workspace-folder
        const disposable = vscode.Disposable.from(this.mFolderWatcher);
        // Dispose the watcher when extension is not active
        this.mContext.subscriptions.push(disposable);
    }


}
