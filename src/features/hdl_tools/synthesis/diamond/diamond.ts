
// specific imports
import { DiamondLdf } from './diamond_package';

// general imports
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import * as xml from 'fast-xml-parser';

//--------------------------------------------------------------
//module-internal constants
//--------------------------------------------------------------
const DIAMOND_PATH_WINDOWS : string = "C:\\lscc\\diamond";
const DIAMOND_PATH_LINUX_OPT : string = "/opt/lscc/diamond";
const DIAMOND_PATH_LINUX_USR: string = "/usr/local/diamond";

const DIAMOND_TCL_CONSOLE : string = "pnmainc";

const DIAMOND_LAUNCH_EXECUTABLE_WINDOWS : string = "pnmain";
const DIAMOND_LAUNCH_EXECUTABLE_LINUX : string = "diamond";

// Lattice-Diamond
export class Diamond
{

    public static async RunTclScriptGUI(scriptPath: string, projectPath: string, outputChannel: vscode.OutputChannel): Promise<boolean> 
    {
        
        let diamondLaunchPath: string | undefined = this.GetDiamondLaunchPath();
    
        if (!diamondLaunchPath) {
            return false;
        }
    
        // Check if the script exists
        if (!fs.existsSync(scriptPath)) {
            return false;
        }
    
        // Execute the TCL script using the Diamond-Tcl-Console
        const diamond = child_process.spawn(diamondLaunchPath, ['-t', scriptPath], {
            cwd: projectPath,
        });
        
        if (diamond === null) {
            // If the Diamond-Tcl-Console failed to start, display an error message
            vscode.window.showInformationMessage('Failed to start Diamond-Tcl-Console!');
            return false;
        }

        outputChannel.show(true);

        // write to file
        diamond.stdout.pipe(fs.createWriteStream(path.join(projectPath, 'diamond.log')));
    
        diamond.stdout.on('data', (data: Buffer) => {
            outputChannel.appendLine(data.toString());
        });

        diamond.stderr.on('data', (data: Buffer) => {
            outputChannel.appendLine(data.toString());
        });

        diamond.on('close', (code: number) => {
            outputChannel.appendLine(`Diamond process exited with code ${code}`);
        });

        //Check if process exited with code 0 (success)
        const exitCode = await new Promise<number>((resolve, reject) => {
            diamond.on('exit', (code: number) => {
                resolve(code);
            });
        });

        diamond.kill();

        return exitCode === 0;
    }

    public static async RunTclScript(scriptPath: string, projectPath: string, outputChannel: vscode.OutputChannel): Promise<boolean>
    {
        const tclConsolePath : string | undefined = this.GetDiamondTclConsolePath();

        if (!tclConsolePath) 
        {
            return false;
        }
        
        const diamondShell = child_process.spawn(tclConsolePath, {
            cwd: projectPath
        });

        diamondShell.stdout.on('data', (data: Buffer) => {
            console.log(data.toString());
            outputChannel.appendLine(data.toString());
            outputChannel.appendLine('received data');
        });

        diamondShell.stderr.on('data', (data: Buffer) => {
            console.error(data.toString());
            outputChannel.appendLine(data.toString());
        });

        diamondShell.on('close', (code: number) => {
            console.log(`Diamond process exited with code ${code}`);
            outputChannel.appendLine(`Diamond process exited with code ${code}`);
        });

        outputChannel.show();

        const adjustedScriptPath = scriptPath.replace(/\\/g, "/");
        const command : string = `source \"${adjustedScriptPath}\"\n`;
        RunTclCommand(command, diamondShell, outputChannel);

        diamondShell.stdin.end();
    
        //wait for process to exit and check if process exited with code 0 (success)
        const exitCode = await new Promise<number>((resolve, reject) => {
            diamondShell.on('exit', (code: number) => {
                resolve(code);
            });
        });

        return exitCode === 0;
    }

    public static async RunTclCommands(commands : string[], projectPath : string, outputChannel : vscode.OutputChannel) : Promise<boolean>
    {
        const tclConsolePath : string | undefined = this.GetDiamondTclConsolePath();

        if (!tclConsolePath) 
        {
            return false;
        }
        
        const diamondShell = child_process.spawn(tclConsolePath, {
            cwd: projectPath
        });

        diamondShell.stdout.on('data', (data: Buffer) => {
            console.log(data.toString());
            outputChannel.appendLine(data.toString());
        });

        diamondShell.stderr.on('data', (data: Buffer) => {
            console.error(data.toString());
            outputChannel.appendLine(data.toString());
        });

        diamondShell.on('close', (code: number) => {
            console.log(`Diamond process exited with code ${code}`);
            outputChannel.appendLine(`Diamond process exited with code ${code}`);
        });

        for (const command of commands)
        {
            RunTclCommand(command, diamondShell, outputChannel);
        }

        diamondShell.stdin.end();
    
        //wait for process to exit and check if process exited with code 0 (success)
        const exitCode = await new Promise<number>((resolve, reject) => {
            diamondShell.on('exit', (code: number) => {
                resolve(code);
            });
        });

        return exitCode === 0;
    }

    public static ParseLdf(ldfPath : string) : DiamondLdf 
    {
        // empty Ldf
        let ldf : DiamondLdf = new DiamondLdf(ldfPath);

        // const ldfFile : string = fs.readFileSync(ldfPath, 'utf8');

        // const parser = new xml.XMLParser();
        // parser.parse(ldfFile);

        return ldf;
    }

    public static GetDiamondRootPath() : string | undefined
    {
        let diamondPath : string | undefined;
    
        // check if path is specified in environment variables
        diamondPath = GetDiamondRootPathFromEnv();
    
        if(!diamondPath)
        {
            // get default path
            diamondPath = GetDiamondRootPathFromDefaultPaths();
        }
    
        if(!diamondPath)
        {
            // TODO:
            // get version from extension-settings
        }
    
        return diamondPath;
    }

    public static GetDiamondTclConsolePath() : string | undefined
    {
        const diamondPath : string | undefined = this.GetDiamondRootPath();
        if(!diamondPath)
        {
            return undefined;
        }

        return path.join(diamondPath, 'bin', 'nt64', DIAMOND_TCL_CONSOLE);
    }

    public static GetDiamondLaunchPath() : string | undefined
    {
        const diamondPath : string | undefined = this.GetDiamondRootPath();
        if(!diamondPath)
        {
            return undefined;
        }

        const OperatingSystem = process.platform;
        let DiamondLaunchPath : string | undefined;

        if(OperatingSystem === 'win32')
        {
            DiamondLaunchPath = path.join(diamondPath, 'bin', 'nt64', DIAMOND_LAUNCH_EXECUTABLE_WINDOWS);
        }
        else if(OperatingSystem === 'linux')
        {
            DiamondLaunchPath = path.join(diamondPath, 'bin', 'nt64', DIAMOND_LAUNCH_EXECUTABLE_LINUX);
        }

        return DiamondLaunchPath;
    }
    
}

function RunTclCommand(command : string, tclConsoleProcess : child_process.ChildProcessWithoutNullStreams, outputChannel : vscode.OutputChannel) : void
{
    tclConsoleProcess.stdin.cork();
    tclConsoleProcess.stdin.write(`${command}\n`);
    tclConsoleProcess.stdin.uncork();
    outputChannel.appendLine(command);
}

function GetDiamondRootPathFromEnv() : string | undefined
{
    let diamondLicensePath = process.env.LM_LICENSE_FILE || '';

    // remove the last semicolon and everything after it
    const semicolonIndex = diamondLicensePath.indexOf(';');
    if (semicolonIndex !== -1) {
        diamondLicensePath = diamondLicensePath.substring(0, semicolonIndex);
    }

    // check if path exists
    if (!fs.existsSync(diamondLicensePath)) {
        return undefined;
    }

    let diamondRootPath : string = path.join(diamondLicensePath, '..', '..');

    // check if path exists
    if (!fs.existsSync(diamondRootPath)) {
        return undefined;
    }

    return diamondRootPath;
}

function GetDiamondRootPathFromDefaultPaths() : string | undefined
{
    const OperatingSystem = process.platform;
    let DiamondPath : string | undefined;

    if(OperatingSystem === 'win32')
    {
        if(!fs.existsSync(DIAMOND_PATH_WINDOWS))
        {
            return undefined;
        }

        const NewestVersion : number | undefined = GetNewestDiamondVersion(DIAMOND_PATH_WINDOWS);
        if(!NewestVersion) { return undefined; }

        DiamondPath = path.join(DIAMOND_PATH_WINDOWS, NewestVersion.toString());

        return DiamondPath;
    }
    else if(OperatingSystem === 'linux')
    {
        if(!fs.existsSync(DIAMOND_PATH_LINUX_OPT))
        {
            if(!fs.existsSync(DIAMOND_PATH_LINUX_USR))
            {
                return undefined;
            }

            const NewestVersion : number | undefined = GetNewestDiamondVersion(DIAMOND_PATH_LINUX_USR);
            if(!NewestVersion) { return undefined; }

            DiamondPath = path.join(DIAMOND_PATH_LINUX_USR, NewestVersion.toString());

            return DiamondPath;
        }

        const NewestVersion : number | undefined = GetNewestDiamondVersion(DIAMOND_PATH_LINUX_OPT);
        if(!NewestVersion) { return undefined; }

        DiamondPath = path.join(DIAMOND_PATH_LINUX_OPT, NewestVersion.toString());

        return DiamondPath;
    }

    return undefined;
}

function GetNewestDiamondVersion(defaultPath : string) : number | undefined
{
    let NewestVersion: number | undefined;

    //check if specified path exists
    if (!fs.existsSync(defaultPath)) {
        return undefined;
    }

    //read all directories in specified path and search for newest version
    const files = fs.readdirSync(defaultPath, { withFileTypes: true });

    // Filter out only directories
    const directories: fs.Dirent[] = files.filter(file => file.isDirectory());

    // Get newest version of Quartus available
    const directoryNames: number[] = directories
        .map(directory => parseFloat(directory.name))
        .filter(floatValue => !isNaN(floatValue));

    NewestVersion = Math.max(...directoryNames);

    return NewestVersion;
}