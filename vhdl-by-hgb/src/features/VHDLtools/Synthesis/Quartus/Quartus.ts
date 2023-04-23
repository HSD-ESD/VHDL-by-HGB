//Specific Imports
import * as Constants from "../../../../Constants";
import * as TclScripts from "../TclScripts";
import { OS } from "colibri2/out/process/common";
import { get_os } from "colibri2/out/process/utils";
import { FileHolder, VHDL_TOP_LEVEL_ENTITY } from "../../../FileTools/FileHolder";
import { TclGenerator } from "../../../FileTools/FileGenerator/TclGenerator";
import { FileUtils } from "../../../FileTools/FileUtils";

import { Hdl_element } from "colibri2/out/parser/common";
import { Vhdl_parser } from "colibri2/out/parser/ts_vhdl/parser";
//import { Vhdl_parser } from "colibri2/src/parser/ts_vhdl/parser";

//General Imports
import * as fs from "fs";
import * as vscode from "vscode";
import * as path from 'path';
import * as child_process from 'child_process';

//--------------------------------------------------------------
//module-internal constants
//--------------------------------------------------------------
const QUARTUS_PATH_WINDOWS : string = "C:\\intelFPGA_lite";
const QUARTUS_PATH_LINUX : string = "/opt/intelFPGA_lite";

const QUARTUS_SHELL = "quartus_sh";
const QUARTUS_EXE = "quartus";

//--------------------------------------------------------------
// Quartus class
//--------------------------------------------------------------
export class Quartus {

    // --------------------------------------------
    // Private members
    // --------------------------------------------

    // vscode-members
    private mOutputChannel : vscode.OutputChannel;
    private mContext : vscode.ExtensionContext;

    // class-specific members
    private mFileHolder : FileHolder;
    private mTclGenerator : TclGenerator;

    private mQuartusBinaryPath : string = "";
    private mQuartusExePath : string = "";
    private mProjectName : string = "";
    private mProjectPath : string = "";
    private mTclScriptsFolder : string = "";


    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(fileHolder : FileHolder, ouputChannel : vscode.OutputChannel, context : vscode.ExtensionContext) 
    {
        this.mOutputChannel = ouputChannel;
        this.mContext = context;
        this.mFileHolder = fileHolder;
        this.mQuartusBinaryPath = SearchQuartusPath();
        this.mQuartusExePath = path.join(this.mQuartusBinaryPath, QUARTUS_EXE);
        this.mTclGenerator = new TclGenerator(this);

        this.RegisterCommands();
    }

    public async GenerateProject() : Promise<boolean> 
    {
        let IsSuccess : boolean = true;

        //if valid quartus path does not exist -> select path
        if(this.mQuartusBinaryPath.length === 0)
        {
            IsSuccess = await this.SelectQuartusBinaryPath();

            if(!IsSuccess)
            {
                vscode.window.showInformationMessage('Quartus-Project could not be generated!');
                return false;
            }
        }

        // enter project name
        await vscode.window.showInputBox({
            prompt: "Enter Project-Name",
            placeHolder: "MyProject",
        }).then((projectName) => {
            if(projectName) 
            {
                this.mProjectName = projectName;
            }
            else
            {
                vscode.window.showInformationMessage('No valid Project-Name!');
                return false;
            }
        });

        //Enter project location
        const projectPath = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Quartus-Project-Folder'
          });

          if (projectPath && projectPath[0] && projectPath[0].fsPath)
          {
            //read chosen directory and check, if a quartus-project already exists in this folder
            const files = fs.readdirSync(projectPath[0].fsPath);
            const projectFile = files.find((file) => file.endsWith(".qpf"));
            if (projectFile) {
                vscode.window.showInformationMessage('A Quartus-Project already exists in this folder!'); 
                return false;
            }

            //chosen path is valid and gets stored
            this.mProjectPath = projectPath[0].fsPath;
            vscode.window.showInformationMessage('Project-Location was set successfully!');
          }
          else
          {
            vscode.window.showInformationMessage('No valid Project-Location!');
            return false;
          }
        
        //check for Top-Level-Entity
        if(this.mFileHolder.GetTopLevelEntity(VHDL_TOP_LEVEL_ENTITY.Synthesis).length === 0)
        {
            //select top-level-entity
            IsSuccess = await this.SelectTopLevelEntity();
            if(!IsSuccess) {return false;}
        }

        //When new Quartus-Project is created -> make directory for all Tcl-Scripts
        this.mTclScriptsFolder = path.join(this.mProjectPath, TclScripts.Folder);
        if (!fs.existsSync(this.mTclScriptsFolder)) {
            fs.mkdirSync(this.mTclScriptsFolder);
        }

        //create tcl-script
        this.mTclGenerator.GenerateQuartusProject();

        //Run Tcl-Script for generating Project
        IsSuccess = await this.RunTclScript(TclScripts.GenerateProject);

        if (!IsSuccess) {
          vscode.window.showErrorMessage("Creating Quartus-Project failed!");
          return false;
        }

        vscode.window.showInformationMessage('Quartus-Project was created successfully!');

        return true;
    }


    public async UpdateFiles() : Promise<boolean>
    {
        if(this.mProjectName.length === 0 || this.mProjectPath.length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> Files cannot be updated!');
            return false;
        }

        this.mTclGenerator.GenerateUpdateFiles();

        const IsSuccess : boolean = await this.RunTclScript(TclScripts.UpdateFiles);

        if (!IsSuccess) {
          vscode.window.showErrorMessage("Updating files in Quartus-Project failed!");
          return false;
        }

        vscode.window.showInformationMessage('Files in Quartus-Project were updated successfully!');
        return true;
    }

    public UpdateProject() : void {}

    public SetDevice(device : string) : void {}

    public SetTopLevelEntity(entity : string) : void {}

    public async LaunchGUI() : Promise<boolean>
    {
        if(this.mProjectName.length === 0 || this.mProjectPath.length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> GUI cannot be launched!');
            return false;
        }

        if( !fs.existsSync(path.join(this.mTclScriptsFolder, TclScripts.LaunchGUI)))
        {
           this.mTclGenerator.GenerateLaunchGUI(); 
        }

        //Run Tcl-Script for launching GUI
        const IsSuccess : boolean = await this.RunTclScript(TclScripts.LaunchGUI);

        if (!IsSuccess) {
            vscode.window.showErrorMessage("Launching Quartus-Project failed!");
            return false;
        }

        return true;
    }

    public async Compile() : Promise<boolean>
    {
        if(this.mProjectName.length === 0 || this.mProjectPath.length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> GUI cannot be launched!');
            return false;
        }

        if( !fs.existsSync(path.join(this.mTclScriptsFolder, TclScripts.Compile)))
        {
           this.mTclGenerator.GenerateCompile(); 
        }

        //Run Tcl-Script for generating Project
        const IsSuccess : boolean = await this.RunTclScript(TclScripts.Compile);

        if (!IsSuccess) {
            vscode.window.showErrorMessage("Compiling Quartus-Project failed!");
            return false;
        }

        return true;
    }

    //Getter-Methods
    public GetProjectName() : string {return this.mProjectName;}
    public GetProjectPath() : string {return this.mProjectPath;}
    public GetFileHolder() : FileHolder {return this.mFileHolder;}
    public GetQuartusBinaryPath() : string {return this.mQuartusBinaryPath;}
    public GetQuartusExePath() : string {return this.mQuartusExePath;}
    public GetTclScriptsPath() : string {return this.mTclScriptsFolder;}

    public IsBlackListed(fileName : string)
    {
        // ignore testbenches for synthesis
            //return /^tb\b/.test(fileName);
        return fileName.startsWith("tb");
    }


    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private RegisterCommands() : void
    {
        let disposable : vscode.Disposable;

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Quartus.SetBinaryPath", () => { this.SelectQuartusBinaryPath(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Quartus.GenerateProject", () => { this.GenerateProject(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Quartus.UpdateFiles", () => { this.UpdateFiles(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Quartus.Compile", () => { this.Compile(); });
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Quartus.GUI", () => { this.LaunchGUI(); });
        this.mContext.subscriptions.push(disposable);

    }

    private async SelectQuartusBinaryPath() : Promise<boolean> 
    {
        try {

            const uri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Folder of Quartus-Binaries'
            });

            if (uri && uri[0] && uri[0].fsPath && fs.existsSync(path.join(uri[0].fsPath, get_os() === OS.LINUX ? QUARTUS_SHELL : (QUARTUS_SHELL + ".exe" ))))
            {
                console.log(uri[0].fsPath);
                if(uri[0].fsPath.length === 0) {console.log("length == 0");}
                // Store quartus-path internally
                this.mQuartusBinaryPath = uri[0].fsPath;
                vscode.window.showInformationMessage('Folder containing Quartus-Binaries was selected successfully!');
                return true;
            }
            else
            {
                vscode.window.showInformationMessage('No valid folder containing Quartus-Binaries was selected!');
                return false;
            }

        } catch (err) {
            console.error(err);
            return false;
        }
    }

    private async RunTclScript(TclScript : string) : Promise<boolean>
    {
        //check, if specified Tcl-Script exists
        if(!fs.existsSync(path.join(this.mProjectPath, TclScripts.Folder, TclScript)))
        {
            //wait until specified tcl-script really exists
            const IsSuccess : boolean = await FileUtils.WaitForFileCreation(path.join(this.mTclScriptsFolder, TclScript));

            if(!IsSuccess)
            {
                vscode.window.showInformationMessage('Tcl-Script to be executed does not exist!');
                return false;
            }
        }

        //path for quartus-shell
        const QuartusShellPath : string = path.join(this.mQuartusBinaryPath, QUARTUS_SHELL);

        //execute tcl-script with quartus-shell
        const quartusShell = child_process.spawn(QuartusShellPath, ['-t', path.join(this.mProjectPath, TclScripts.Folder, TclScript)], {
            cwd: this.mProjectPath
        });

        if (quartusShell === null) {
            vscode.window.showInformationMessage('Failed to start Quartus-Shell!');
            return false;
        }

        quartusShell.stdout.on('data', (data: Buffer) => {
            console.log(data.toString());
            this.mOutputChannel.appendLine(data.toString());
        });
          
        quartusShell.stderr.on('data', (data: Buffer) => {
            console.error(data.toString());
            this.mOutputChannel.appendLine(data.toString());
        });
        
        quartusShell.on('close', (code: number) => {
            console.log(`Quartus process exited with code ${code}`);
            this.mOutputChannel.appendLine(`Quartus process exited with code ${code}`);
        });

        //Check if process exited with code 0 (success)
        const exitCode = await new Promise<number>((resolve, reject) => {
            quartusShell.on('exit', (code: number) => {
                resolve(code);
            });
        });

        //terminate child-process for quartusShell
        quartusShell.kill();

        //check, if process was executed without any errors and return result
        const IsSuccess : boolean = exitCode === 0;

        return true;
    }

    private async SelectTopLevelEntity() : Promise<boolean>
    {
        //Enter project location
        const TopLevelEntity = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: 'Select Top-Level-Entity'
        });

        if (TopLevelEntity && TopLevelEntity[0] && TopLevelEntity[0].fsPath && TopLevelEntity[0].fsPath.endsWith(".vhd"))
        {

            // let parser : Vhdl_parser = new Vhdl_parser();
            // parser.init();

            // let doc = await vscode.workspace.openTextDocument(TopLevelEntity[0].fsPath);
            // let text : string = await doc.getText();
            
            // console.log(text);

            // let EntityName : string;
            // let VhdlFileInfo : Hdl_element;

            // if(text)
            // {
            //     VhdlFileInfo =  await parser.get_all(text,'--');
            //     this.mFileHolder.SetTopLevelEntity(VhdlFileInfo.name, VHDL_TOP_LEVEL_ENTITY.Synthesis);
            // }

            let substr : string = path.basename(TopLevelEntity[0].fsPath).split(".")[0].split("-")[0];
            
            if(substr)
            {
                this.mFileHolder.SetTopLevelEntity(substr, VHDL_TOP_LEVEL_ENTITY.Synthesis);
                vscode.window.showInformationMessage('Top-Level-Entity was set successfully!');
                return true;
            }
            else
            {
                vscode.window.showInformationMessage('No valid Top-Level-Entity!');
                return false;
            }
        }

        vscode.window.showInformationMessage('No valid File selected as Top-Level-Entity!');
        return false;
    }

}


//automatically get Quartus path with newest version -> if not found, path will be empty
function SearchQuartusPath() : string 
{
    const OperatingSystem : OS = get_os();
    let QuartusPath : string = "";

    if(OperatingSystem === OS.WINDOWS)
    {
        let QuartusVersion : string = GetNewestQuartusVersion(QUARTUS_PATH_WINDOWS);
        
        //check for empty string
        if(QuartusVersion.length === 0)
        {
            return QuartusPath;
        }

        QuartusPath = path.join(QUARTUS_PATH_WINDOWS, QuartusVersion.toString());
    
    }
    else if(OperatingSystem === OS.LINUX)
    {
        let QuartusVersion : string = GetNewestQuartusVersion(QUARTUS_PATH_LINUX);
        
        //check for empty string
        if(QuartusVersion.length === 0)
        {
            return QuartusPath;
        }

        QuartusPath = path.join(QUARTUS_PATH_LINUX, QuartusVersion.toString());

    }

    //default folder for Quartus-binaries
    QuartusPath = path.join(QuartusPath, "quartus", "bin64");
    
    //check if path exists
    if(!fs.existsSync(QuartusPath))
    {
        return "";
    }

    return QuartusPath;
}

//get newest Quartus version from specified path (intelFPGA_lite)
function GetNewestQuartusVersion(DefaultPath : string) : string 
{

    let NewestVersion : number = 0;

    //check if specified path exists
    if(!fs.existsSync(DefaultPath))
    {
        return "";
    }
    
    //read all directories in specified path and search for newest version
    const files = fs.readdirSync(DefaultPath, { withFileTypes: true });

    // Filter out only directories
    const directories: fs.Dirent[] = files.filter(file => file.isDirectory());

    // Get newest version of Quartus available
    const directoryNames: number[] = directories
        .map(directory => parseFloat(directory.name))
        .filter(floatValue => !isNaN(floatValue));

    NewestVersion = Math.max(...directoryNames);
    
    return NewestVersion.toString();
}
