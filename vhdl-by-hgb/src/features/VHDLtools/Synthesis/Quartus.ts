//Specific Imports
import * as Constants from "./../../../Constants";
import { OS } from "colibri2/out/process/common";
import { get_os } from "colibri2/out/process/utils";
import { FileHolder } from "../../FileTools/FileHolder";
import { TclGenerator } from "./../../FileTools/FileGenerator/TclGenerator";


//General Imports
import * as fs from "fs";
import * as vscode from "vscode";
import * as path from 'path';


//--------------------------------------------------------------
//module-internal constants
//--------------------------------------------------------------
const QUARTUS_PATH_WINDOWS : string = "C:\\intelFPGA_lite";
const QUARTUS_PATH_LINUX : string = "/opt/intelFPGA_lite";


//--------------------------------------------------------------
// Quartus class
//--------------------------------------------------------------
export class Quartus {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mFileHolder : FileHolder;
    private mQuartusPath : string = "";
    private mTclGenerator : TclGenerator;
    

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(fileHolder : FileHolder) 
    {
        this.SetCommands();
        this.mFileHolder = fileHolder;
        this.mQuartusPath = SearchQuartusPath();
        this.mTclGenerator = new TclGenerator();
    }

    public GenerateProject() : void 
    {
        //if valid quartus path does not exist -> select path
        if(this.mQuartusPath.length === 0)
        {
            // if selected path is invalid -> print message
            if(!this.SelectQuartusPath())
            {
                vscode.window.showInformationMessage('Quartus-Project could not be generated!');
            }
            
        }

        //create tcl-script

        //execute tcl-script with quartus-shell

    }

    public UpdateProject() : void {}

    public SetDevice(device : string) : void {}

    public SetTopLevelEntity(entity : string) : void {}

    public GUI() : void {}

    public Compile() : void {}

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private SetCommands() : void
    {
        vscode.commands.registerCommand("VHDLbyHGB.Quartus.SetBinaryPath", this.SelectQuartusPath);
        vscode.commands.registerCommand("VHDLbyHGB.Quartus.GenerateProject", this.GenerateProject);
        vscode.commands.registerCommand("VHDLbyHGB.Quartus.Compile", this.Compile);
        vscode.commands.registerCommand("VHDLbyHGB.Quartus.GUI", this.GUI);
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

        if (uri && uri[0] && uri[0].fsPath && fs.existsSync(path.join(uri[0].fsPath, get_os() === OS.LINUX ? Constants.QuartusShell : (Constants.QuartusShell + ".exe" ))))
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
}

function ExecuteQuartusCommand(command : string)
{
    
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