//Specific Imports
import * as Constants from "./../../../Constants";
import * as TclScripts from "./TclScripts";
import { OS } from "colibri2/out/process/common";
import { get_os } from "colibri2/out/process/utils";
import { FileHolder, VHDL_TOP_LEVEL_ENTITY } from "../../FileTools/FileHolder";
import { TclGenerator } from "./../../FileTools/FileGenerator/TclGenerator";

import { Hdl_element } from "colibri2/out/parser/common";
import { Vhdl_parser } from "colibri2/out/parser/ts_vhdl/parser";
//import { Vhdl_parser } from "colibri2/src/parser/ts_vhdl/parser";

//General Imports
import * as fs from "fs";
import * as vscode from "vscode";
import * as path from 'path';
import * as child_process from 'child_process';
import * as chokidar from 'chokidar';

//--------------------------------------------------------------
//module-internal constants
//--------------------------------------------------------------
const QUARTUS_PATH_WINDOWS : string = "C:\\intelFPGA_lite";
const QUARTUS_PATH_LINUX : string = "/opt/intelFPGA_lite";

const QUARTUS_SHELL = "quartus_sh";

//--------------------------------------------------------------
// Quartus class
//--------------------------------------------------------------
export class Quartus {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mFileHolder : FileHolder;
    private mTclGenerator : TclGenerator;

    private mQuartusPath : string = "";
    private mProjectName : string = "";
    private mProjectPath : string = "";
    

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(fileHolder : FileHolder) 
    {
        this.mFileHolder = fileHolder;
        this.mQuartusPath = SearchQuartusPath();
        this.mTclGenerator = new TclGenerator(this);

        this.SetCommands();
    }

    public async GenerateProject() : Promise<boolean> 
    {
        let IsSuccess : boolean = true;

        //if valid quartus path does not exist -> select path
        if(this.mQuartusPath.length === 0)
        {
            IsSuccess = await this.SelectQuartusPath();

            if(!IsSuccess)
            {
                vscode.window.showInformationMessage('Quartus-Project could not be generated!');
                return false;
            }
        }

        // project name
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
        const uri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Quartus-Project-Folder'
          });

          if (uri && uri[0] && uri[0].fsPath)
          {
            this.mProjectPath = uri[0].fsPath;
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

        //create tcl-script
        await this.mTclGenerator.GenerateQuartusProject();

        //wait for the tcl script to be generated
        await new Promise(resolve => setTimeout(resolve, 5000)); // wait for 5 seconds

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

    public GUI() : void {}

    public Compile() : void {}

    //Getter-Methods
    public GetProjectName() : string {return this.mProjectName;}
    public GetProjectPath() : string {return this.mProjectPath;}
    public GetFileHolder() : FileHolder {return this.mFileHolder;}


    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private SetCommands() : void
    {
        vscode.commands.registerCommand("VHDLbyHGB.Quartus.SetBinaryPath", () => { this.SelectQuartusPath(); });
        vscode.commands.registerCommand("VHDLbyHGB.Quartus.GenerateProject", () => { this.GenerateProject(); });
        vscode.commands.registerCommand("VHDLbyHGB.Quartus.UpdateFiles", () => { this.UpdateFiles(); });
        vscode.commands.registerCommand("VHDLbyHGB.Quartus.Compile", () => { this.Compile(); });
        vscode.commands.registerCommand("VHDLbyHGB.Quartus.GUI", () => { this.GUI(); });
    }

    private async SelectQuartusPath() : Promise<boolean> 
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
                this.mQuartusPath = uri[0].fsPath;
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
        //wait until file actually exists
        await waitForFileCreation(path.join(this.mProjectPath, TclScripts.Folder, TclScript));

        //check, if specified Tcl-Script exists
        if(!fs.existsSync(path.join(this.mProjectPath, TclScripts.Folder, TclScript)))
        {
            vscode.window.showInformationMessage('Tcl-Script to be executed does not exist!');
            return false;
        }

        //path for quartus-shell
        const QuartusShellPath : string = path.join(this.mQuartusPath, QUARTUS_SHELL);

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
          });
          
        quartusShell.stderr.on('data', (data: Buffer) => {
        console.error(data.toString());
        });
        
        quartusShell.on('close', (code: number) => {
        console.log(`Quartus process exited with code ${code}`);
        });

        //Check if process exited with code 0 (success)
        const exitCode = await new Promise<number>((resolve, reject) => {
            quartusShell.on('exit', (code: number) => {
                resolve(code);
            });
        });

        quartusShell.kill();

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

            let parser : Vhdl_parser = new Vhdl_parser();
            let VhdlFileInfo : Hdl_element =  parser.get_all(TopLevelEntity[0].fsPath,"");

            console.log(VhdlFileInfo.name);

            this.mFileHolder.SetTopLevelEntity(VhdlFileInfo.name, VHDL_TOP_LEVEL_ENTITY.Synthesis);

            // let substr : string = path.basename(TopLevelEntity[0].fsPath).split(".")[0].split("-")[0];
            
            // if(substr)
            // {
            //     this.mFileHolder.SetTopLevelEntity(substr, VHDL_TOP_LEVEL_ENTITY.Synthesis);
            //     vscode.window.showInformationMessage('Top-Level-Entity was set successfully!');
            //     return true;
            // }
            // else
            // {
            //     vscode.window.showInformationMessage('No valid Top-Level-Entity!');
            //     return false;
            // }
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

async function waitForFileCreation(filePath : string, timeout : number = 5000) : Promise<void> {
    return new Promise((resolve, reject) => {
      const watcher = chokidar.watch(filePath);
  
      // Event listener for file creation
      watcher.on('add', () => {
        watcher.close();
        resolve();
      });
  
      // Handle errors
      watcher.on('error', (error) => {
        watcher.close();
        reject(error);
      });
  
      // Timeout
      setTimeout(() => {
        watcher.close();
        reject(new Error(`Timeout waiting for file creation: ${filePath}`));
      }, timeout);
    });
  }