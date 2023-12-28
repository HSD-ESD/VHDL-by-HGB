//Specific Imports
import { ISynthesisProject, SynthesisProject} from "../SynthesisProject";
import  {CustomQuartusTclScript, CustomQuartusTclScriptsFolder} from "./QuartusPackage";
import { QuartusScriptGenerator } from "../../../FileTools/FileGenerator/ScriptGenerator/QuartusScriptGenerator";
import { Quartus} from "./Quartus";
import { VhdlEntity } from "../../VhdlPackage";
import { HDLUtils } from "../../../FileTools/HDLUtils";
import { QuartusQsf} from "./QuartusPackage";
import { eSynthesisFile, eSynthesisTool } from "../SynthesisPackage";

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
    private mTclScriptsFolder: string;
    private mQSF : QuartusQsf;

    //vscode-members
    private mOutputChannel : vscode.OutputChannel;
    private mContext : vscode.ExtensionContext;
    private mQsfWatcher : vscode.FileSystemWatcher;

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
        const qsfPath = path.join(this.mFolderPath, this.mName + eSynthesisFile.Quartus);
        this.mQSF = new QuartusQsf(qsfPath);

        //When new project is created -> make directory for all Tcl-Scripts
        this.mTclScriptsFolder = path.join(this.mFolderPath, CustomQuartusTclScriptsFolder);
        if (!fs.existsSync(this.mTclScriptsFolder)) {
            fs.mkdirSync(this.mTclScriptsFolder);
        }

        this.mQsfWatcher = vscode.workspace.createFileSystemWatcher(this.mQSF.Path);
        this.HandleFileEvents();

        if(fs.existsSync(this.mQSF.Path))
        {
            this.Update();
        }
    }
    
    public async Generate() : Promise<boolean>
    {
        //create tcl-script for generating a Quartus-Project
        const scriptPath = QuartusScriptGenerator.GenerateProject(this);

        if (!scriptPath)
        {
            vscode.window.showErrorMessage(`Creating Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        //Run Tcl-Script for generating Project
        const IsSuccess : boolean = await this.mQuartus.RunTclScript(scriptPath);

        QuartusScriptGenerator.DeleteScript(scriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Creating Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        vscode.window.showInformationMessage(`Quartus-Project "${this.mName}" was created successfully!`);

        return true;
    }

    public async UpdateFiles() : Promise<boolean>
    {
        if(!this.mQSF.TopLevelEntity.mPath || this.mQSF.TopLevelEntity.mPath.length === 0)
        {
            const symbolInfo = await HDLUtils.GetSymbolInformation(this.mQSF.TopLevelEntity.mName);
            if(!symbolInfo[0])
            {
                vscode.window.showErrorMessage(`TopLevelEntity required for updating files of Quartus-Project "${this.mName}"!`);
                return false;
            }

            this.mQSF.TopLevelEntity.mPath = symbolInfo[0].location.uri.fsPath;
        }

        const files : Set<string> = await HDLUtils.GetDependencies(this.mQSF.TopLevelEntity.mPath);
        this.mQSF.VhdlFiles = Array.from(files);
        
        //create tcl-script for updating files of a Quartus-Project
        const scriptPath = QuartusScriptGenerator.GenerateUpdateFiles(this);

        if (!scriptPath)
        {
            vscode.window.showErrorMessage(`Updating files in Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        //Run Tcl-Script for updating files of a Quartus-Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(scriptPath);

        QuartusScriptGenerator.DeleteScript(scriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Updating files in Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        vscode.window.showInformationMessage(`Files for Quartus-Project "${this.mName}" were updated successfully!`);
        return true;
    }

    public async LaunchGUI() : Promise<boolean>
    {
        const scriptPath = QuartusScriptGenerator.GenerateLaunchGUI(this);

        if (!scriptPath)
        {
            vscode.window.showErrorMessage(`Launching Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        //Run Tcl-Script for launching GUI
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(scriptPath);

        QuartusScriptGenerator.DeleteScript(scriptPath);

        if (!IsSuccess) {
            vscode.window.showErrorMessage(`Launching Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        return true;
    }

    public async Compile() : Promise<boolean>
    {
        const scriptPath = QuartusScriptGenerator.GenerateCompile(this);

        if (!scriptPath)
        {
            vscode.window.showErrorMessage(`Compiling Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        //inform user about compiling
        vscode.window.showInformationMessage(`Quartus-Project "${this.mName}" -> compiling started...`);
        this.mOutputChannel.show();

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(scriptPath);

        QuartusScriptGenerator.DeleteScript(scriptPath);

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
        const scriptPath = QuartusScriptGenerator.GenerateTopLevelEntity(this);

        if (!scriptPath)
        {
            vscode.window.showErrorMessage(`Setting TopLevelEntity for Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(scriptPath);

        QuartusScriptGenerator.DeleteScript(scriptPath);

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
        const scriptPath = QuartusScriptGenerator.GenerateFamily(this);

        if (!scriptPath)
        {
            vscode.window.showErrorMessage(`Setting Family for Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(scriptPath);

        QuartusScriptGenerator.DeleteScript(scriptPath);

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
        const scriptPath = QuartusScriptGenerator.GenerateDevice(this);

        if (!scriptPath)
        {
            vscode.window.showErrorMessage(`Setting Device for Quartus-Project "${this.mName}" failed!`);
            return false;
        }

        //Run Tcl-Script for generating Project
        const IsSuccess: boolean = await this.mQuartus.RunTclScript(scriptPath);

        QuartusScriptGenerator.DeleteScript(scriptPath);

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

    public GetPath() : string { return this.mQSF.Path; }

    public GetFolderPath() : string { return this.mFolderPath; }

    public GetQuartus() : Quartus { return this.mQuartus; }

    public GetQsf() : QuartusQsf { return this.mQSF; }

    public GetTool() : eSynthesisTool { return eSynthesisTool.Quartus; }

    // --------------------------------------------
    // private methods
    // --------------------------------------------
    private async Update() : Promise<void>
    {
        this.mQSF = await this.mQuartus.ParseQsf(this.mQSF.Path);
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
