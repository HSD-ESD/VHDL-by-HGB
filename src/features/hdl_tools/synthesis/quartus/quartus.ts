//Specific Imports
import { FileUtils } from "../../../utils/fs/file_utils";
import {QuartusQsf} from "./quartus_package";

//General Imports
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import * as process from 'process';
import * as child_process from 'child_process';

//--------------------------------------------------------------
//module-internal constants
//--------------------------------------------------------------
const QUARTUS_PATH_WINDOWS: string = "C:\\intelFPGA_lite";
const QUARTUS_PATH_LINUX: string = "/opt/intelFPGA_lite";

const QUARTUS_SHELL = "quartus_sh";
const QUARTUS_EXE = "quartus";

const cFamilyRegex   : RegExp = /^set_global_assignment\s+-name\s+FAMILY\s+"([^"]+)"/;
const cDeviceRegex   : RegExp = /^set_global_assignment\s+-name\s+DEVICE\s+([^"\s]+)/;
const cTopLevelRegex : RegExp = /^set_global_assignment\s+-name\s+TOP_LEVEL_ENTITY\s+([^"\s]+)/;
const cVhdlFileRegexWithQuotation : RegExp = /^set_global_assignment\s+-name\s+VHDL_FILE\s+"([^"]+\.(vhd|vhdl))"/;
const cVhdlFileRegex : RegExp = /^set_global_assignment\s+-name\s+VHDL_FILE\s+([^\s]+(?:\.vhd|\.vhdl))/;

//--------------------------------------------------------------
// Quartus class
//--------------------------------------------------------------
export class Quartus {

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public static async RunTclScript(scriptPath: string, projectFolderPath : string, outputChannel : vscode.OutputChannel): Promise<boolean> 
    {
        const quartusBinaryPath : string | undefined = this.GetQuartusBinaryPath();

        if (!quartusBinaryPath) {
            return false;
        }

        //check, if specified Tcl-Script exists
        if (!fs.existsSync(scriptPath)) {
            return false;
        }

        //path for quartus-shell
        const QuartusShellPath: string = path.join(quartusBinaryPath, QUARTUS_SHELL);

        //execute tcl-script with quartus-shell
        const quartusShell = child_process.spawn(QuartusShellPath, ['-t', scriptPath], {
            cwd: projectFolderPath
        });

        if (quartusShell === null) {
            vscode.window.showInformationMessage('Failed to start Quartus-Shell!');
            return false;
        }

        outputChannel.show(true);

        quartusShell.stdout.on('data', (data: Buffer) => {
            console.log(data.toString());
            outputChannel.appendLine(data.toString());
        });

        quartusShell.stderr.on('data', (data: Buffer) => {
            console.error(data.toString());
            outputChannel.appendLine(data.toString());
        });

        quartusShell.on('close', (code: number) => {
            console.log(`Quartus process exited with code ${code}`);
            outputChannel.appendLine(`Quartus process exited with code ${code}`);
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
        let IsSuccess : boolean = exitCode === 0;

        return IsSuccess;
    }

    public static async RunTclCommand(tclCommand: string, projectFolderPath : string, outputChannel : vscode.OutputChannel): Promise<boolean> {

        const quartusBinaryPath : string | undefined = this.GetQuartusBinaryPath();

        if (!quartusBinaryPath) {
            return false;
        }
    
        //path for quartus-shell
        const QuartusShellPath: string = path.join(quartusBinaryPath, QUARTUS_SHELL);
    
        //execute tcl-command with quartus-shell
        const quartusShell = child_process.spawn(QuartusShellPath, ['-tcl', tclCommand], {
            cwd: projectFolderPath //set current working directory to Quartus-Project-Folder
        });
    
        if (quartusShell === null) {
            vscode.window.showInformationMessage('Failed to start Quartus-Shell!');
            return false;
        }
    
        quartusShell.stdout.on('data', (data: Buffer) => {
            console.log(data.toString());
            outputChannel.appendLine(data.toString());
        });
    
        quartusShell.stderr.on('data', (data: Buffer) => {
            console.error(data.toString());
            outputChannel.appendLine(data.toString());
        });
    
        quartusShell.on('close', (code: number) => {
            console.log(`Quartus process exited with code ${code}`);
            outputChannel.appendLine(`Quartus process exited with code ${code}`);
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
    
        return IsSuccess;
    }

    public static async ParseQsf(qsfPath : string) : Promise<QuartusQsf>
    {
        //empty qsf
        let qsf : QuartusQsf = new QuartusQsf(qsfPath);

        //read complete qsf
        const qsfFile : string = fs.readFileSync(qsfPath, 'utf8');
        const qsfFileLines : string[] = qsfFile.split('\n');
        
        for(const line of qsfFileLines)
        {
            await ParseQsfLine(line, qsf); 
        }

        return qsf;
    }

    //Getter-Methods

    //automatically get Quartus path with newest version -> if not found, path will be empty
    public static GetQuartusBinaryPath() : string | undefined 
    {
        let QuartusBinaryPath : string | undefined;

        //check if path is set in environment variables
        QuartusBinaryPath = GetQuartusBinaryPathFromEnv();

        if (!QuartusBinaryPath) 
        {
            // get default path
            QuartusBinaryPath = GetQuartusPathFromDefaultPaths();
        }

        if(!QuartusBinaryPath)
        {
            // TODO:
            // get version from extension-settings
        }

        return QuartusBinaryPath;
    }

    public static GetExePath() : string | undefined 
    {
        const quartusBinaryPath : string | undefined = this.GetQuartusBinaryPath();
        if (!quartusBinaryPath) {
            return undefined;
        }
        return path.join(quartusBinaryPath, QUARTUS_EXE);
    }

    public static GetShellPath() : string | undefined
    {
        const quartusBinaryPath : string | undefined = this.GetQuartusBinaryPath();
        if (!quartusBinaryPath) {
            return undefined;
        }
        return path.join(quartusBinaryPath, QUARTUS_SHELL);
    }

    public IsBlackListed(fileName: string) {
        return fileName.startsWith("tb");
    }

}


async function ParseQsfLine(line: string, qsf: QuartusQsf): Promise<void> {
    let match: RegExpMatchArray | null;

    match = line.match(cVhdlFileRegexWithQuotation);
    if (match) {
        let filePath = match[1];
        filePath = correctFilePathFromQsfFile(filePath);
        qsf.VhdlFiles.push(filePath);
        return;
    }

    match = line.match(cVhdlFileRegex);
    if (match) {
        let filePath = match[1];
        filePath = correctFilePathFromQsfFile(filePath);
        qsf.VhdlFiles.push(filePath);
        return;
    }

    // extract Top-Level-Entity 
    match = line.match(cTopLevelRegex);
    if (match) {
        qsf.TopLevelEntity.mName = match[1];
        const symbol = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
            'vscode.executeWorkspaceSymbolProvider',
            match[1]
        );
        if(symbol[0])
        {
            qsf.TopLevelEntity.mPath = symbol[0].location.uri.fsPath;
        }
        return;
    }

    // extract Device
    match = line.match(cDeviceRegex);
    if (match) {
        qsf.Device = match[1];
        return;
    }

    // extract Family 
    match = line.match(cFamilyRegex);
    if (match) {
        qsf.Family = match[1];
        return;
    }
}

function GetQuartusBinaryPathFromEnv() : string | undefined
{
    const quartusRootDir = process.env.QUARTUS_ROOTDIR || '';

    // check if path exists
    if (!fs.existsSync(quartusRootDir)) {
        return undefined;
    }

    let quartusBinaryPath : string = path.join(quartusRootDir, "bin64");

    // check if path exists
    if (!fs.existsSync(quartusBinaryPath)) {
        return undefined;
    }

    return quartusBinaryPath;
}

function GetQuartusPathFromDefaultPaths() : string | undefined
{
    const OperatingSystem = process.platform;
    let QuartusPath : string | undefined;

    if (OperatingSystem === 'win32') {
        let QuartusVersion : number | undefined = GetNewestQuartusVersion(QUARTUS_PATH_WINDOWS);

        if (!QuartusVersion) {
            return undefined;
        }

        QuartusPath = path.join(QUARTUS_PATH_WINDOWS, QuartusVersion.toString());
    }
    else if (OperatingSystem === 'linux') {
        let QuartusVersion : number | undefined =  GetNewestQuartusVersion(QUARTUS_PATH_LINUX);

        if (!QuartusVersion) {
            return undefined;
        }

        QuartusPath = path.join(QUARTUS_PATH_LINUX, QuartusVersion.toString());
    }

    if (!QuartusPath) {
        return undefined;
    }

    //default folder for Quartus-binaries
    const QuartusBinaryPath = path.join(QuartusPath, "quartus", "bin64");

    //check if path exists
    if (!fs.existsSync(QuartusBinaryPath)) {
        return undefined;
    }

    return QuartusBinaryPath;
}

//get newest Quartus version from specified path (intelFPGA_lite)
function GetNewestQuartusVersion(DefaultPath: string) : number | undefined 
{
    let NewestVersion: number | undefined;

    //check if specified path exists
    if (!fs.existsSync(DefaultPath)) {
        return undefined;
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

    return NewestVersion;
}

function correctFilePathFromQsfFile(filePath : string) : string 
{
    if (!fs.existsSync(filePath))
    {
        if(!path.isAbsolute(filePath))
        {
            // quartus specifies relative paths from the project-folder,
            // but we want the relative path originating from the qsf-file
            filePath = path.join('..', filePath);
        }
    }

    return filePath;
}
