//Specific Imports
import { FileUtils } from "../../../FileTools/FileUtils";
import {QuartusQsf, cEmptyQsf} from "./QuartusPackage";

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
const cVhdlFileRegex : RegExp = /^set_global_assignment\s+-name\s+VHDL_FILE\s+"([^"]+\.(vhd|vhdl))"/;


//--------------------------------------------------------------
// Quartus class
//--------------------------------------------------------------
export class Quartus {

    // --------------------------------------------
    // Private members
    // --------------------------------------------

    // vscode-members
    private mOutputChannel: vscode.OutputChannel;
    private mContext: vscode.ExtensionContext;

    private mQuartusBinaryPath: string = "";

    // --------------------------------------------
    // Public methods
    // --------------------------------------------

    public constructor(ouputChannel: vscode.OutputChannel, context: vscode.ExtensionContext) {
        //setting vscode-members
        this.mOutputChannel = ouputChannel;
        this.mContext = context;
        this.mQuartusBinaryPath = SearchQuartusBinaryPath();
    }

    public async RunTclScript(TclScript: string): Promise<boolean> 
    {

        let IsSuccess : boolean = false;

        //check, if specified Tcl-Script exists
        if (!fs.existsSync(TclScript)) {
            //wait until specified tcl-script really exists
            IsSuccess = await FileUtils.WaitForFileCreation(TclScript);

            if (!IsSuccess) {
                vscode.window.showInformationMessage('Tcl-Script to be executed does not exist!');
                return false;
            }
        }

        //if no valid quartus binary-path -> select path
        if (this.mQuartusBinaryPath.length === 0) {
            IsSuccess = await this.SelectQuartusBinaryPath();

            if (!IsSuccess) {
                vscode.window.showInformationMessage('Quartus-Binary-Path not set!');
                return false;
            }
        }

        //path for quartus-shell
        const QuartusShellPath: string = path.join(this.mQuartusBinaryPath, QUARTUS_SHELL);

        //execute tcl-script with quartus-shell
        const quartusShell = child_process.spawn(QuartusShellPath, ['-t', TclScript], {
            cwd: path.join(TclScript, "..", "..") //set current working directory to Quartus-Project-Folder
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
        IsSuccess = exitCode === 0;

        return IsSuccess;
    }

    public async RunTclCommand(tclCommand: string, currentWorkingDirectory : string): Promise<boolean> {

        let IsSuccess: boolean = false;
    
        //if no valid quartus binary-path -> select path
        if (this.mQuartusBinaryPath.length === 0) {
            IsSuccess = await this.SelectQuartusBinaryPath();
    
            if (!IsSuccess) {
                vscode.window.showInformationMessage('Quartus-Binary-Path not set!');
                return false;
            }
        }
    
        //path for quartus-shell
        const QuartusShellPath: string = path.join(this.mQuartusBinaryPath, QUARTUS_SHELL);
    
        //execute tcl-command with quartus-shell
        const quartusShell = child_process.spawn(QuartusShellPath, ['-tcl', tclCommand], {
            cwd: currentWorkingDirectory //set current working directory to Quartus-Project-Folder
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
        IsSuccess = exitCode === 0;
    
        return IsSuccess;
    }

    public async ParseQsf(qsfPath : string) : Promise<QuartusQsf>
    {
        //empty qsf
        let qsf : QuartusQsf = cEmptyQsf;

        //read complete qsf
        const qsfFile : string = fs.readFileSync(qsfPath, 'utf8');
        const qsfFileLines : string[] = qsfFile.split('\n');
        
        for(const line of qsfFileLines)
        {
            await this.ParseQsfLine(line, qsf); 
        }

        return qsf;
    }

    //Getter-Methods
    public GetBinaryPath() : string { return this.mQuartusBinaryPath; }

    public GetExePath() : string { return path.join(this.mQuartusBinaryPath, QUARTUS_EXE);}

    public GetShellPath() : string { return path.join(this.mQuartusBinaryPath, QUARTUS_SHELL);}

    public IsBlackListed(fileName: string) {
        return fileName.startsWith("tb");
    }

    // --------------------------------------------
    // Private methods
    // --------------------------------------------

    private async ParseQsfLine(line: string, qsf: QuartusQsf): Promise<void> {
        let match: RegExpMatchArray | null;
    
        match = line.match(cVhdlFileRegex);
        if (match) {
            qsf.VhdlFiles.push(match[1]);
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
            qsf.TopLevelEntity.mPath = symbol[0].location.uri.fsPath;
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

    private async SelectQuartusBinaryPath(): Promise<boolean> {
        try {

            const uri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Folder of Quartus-Binaries'
            });

            if (uri && uri[0] && uri[0].fsPath && fs.existsSync(path.join(uri[0].fsPath, process.platform === 'linux' ? QUARTUS_SHELL : (QUARTUS_SHELL + ".exe")))) 
            {
                console.log(uri[0].fsPath);
                if (uri[0].fsPath.length === 0) { console.log("length == 0"); }
                // Store quartus-path internally
                this.mQuartusBinaryPath = uri[0].fsPath;
                vscode.window.showInformationMessage('Folder containing Quartus-Binaries was selected successfully!');
                return true;
            }
            else {
                vscode.window.showInformationMessage('No valid folder containing Quartus-Binaries was selected!');
                return false;
            }

        } catch (err) {
            console.error(err);
            return false;
        }
    }

}

function GetQuartusBinaryPathFromEnv(): string 
{
    const quartusRootDir = process.env.QUARTUS_ROOTDIR || '';

    let quartusBinaryPath = "";

    quartusBinaryPath = path.join(quartusRootDir, "bin64");

    // check if path exists
    if (!fs.existsSync(quartusBinaryPath)) {
        return "";
    }

    return quartusBinaryPath;
}

//automatically get Quartus path with newest version -> if not found, path will be empty
function SearchQuartusBinaryPath(): string 
{
    const OperatingSystem = process.platform;
    let QuartusPath: string = "";

    if (OperatingSystem === 'win32') {
        let QuartusVersion: string = GetNewestQuartusVersion(QUARTUS_PATH_WINDOWS);

        //check for empty string
        if (QuartusVersion.length === 0) {
            return QuartusPath;
        }

        QuartusPath = path.join(QUARTUS_PATH_WINDOWS, QuartusVersion.toString());

    }
    else if (OperatingSystem === 'linux') {
        let QuartusVersion: string = GetNewestQuartusVersion(QUARTUS_PATH_LINUX);

        //check for empty string
        if (QuartusVersion.length === 0) {
            return QuartusPath;
        }

        QuartusPath = path.join(QUARTUS_PATH_LINUX, QuartusVersion.toString());

    }

    //default folder for Quartus-binaries
    QuartusPath = path.join(QuartusPath, "quartus", "bin64");

    //check if path exists
    if (!fs.existsSync(QuartusPath)) {
        return "";
    }

    return QuartusPath;
}

//get newest Quartus version from specified path (intelFPGA_lite)
function GetNewestQuartusVersion(DefaultPath: string): string {

    let NewestVersion: number = 0;

    //check if specified path exists
    if (!fs.existsSync(DefaultPath)) {
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
