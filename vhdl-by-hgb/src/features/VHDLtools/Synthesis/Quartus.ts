//Specific Imports
import { OS } from "colibri2/out/process/common";
import { get_os } from "colibri2/out/process/utils";
import * as path from 'path';

//Node Imports
import * as fs from "fs";
import { ExtensionContext } from "vscode";

//--------------------------------------------------------------
//module-internal constants
//--------------------------------------------------------------
const QUARTUS_PATH_WINDOWS : string = "C:\\intelFPGA_lite";
const QUARTUS_PATH_LINUX : string = "/opt/intelFPGA_lite";


//--------------------------------------------------------------
// Quartus class
//--------------------------------------------------------------
export class Quartus {

    private mQuartusPath : string;

    public constructor(ctx : ExtensionContext ) 
    {
        this.mQuartusPath = GetQuartusPath();
    }

    public GenerateProject() : void 
    {
        
    }

    public UpdateProject() : void {}

    public SetDevice(device : string) : void {}

    public SetTopLevelEntity(entity : string) : void {}

    public Launch() : void {}

    public Compile() : void {}



}

//automatically get Quartus path with newest version -> if not found, path will be empty
function GetQuartusPath() : string 
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