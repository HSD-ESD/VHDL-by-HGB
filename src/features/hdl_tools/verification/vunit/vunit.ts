'use strict';

//specific imports
import {VUnitExportData} from './vunit_package';

//general imports
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ChildProcess, spawn } from 'child_process';
import kill = require('tree-kill');
import readline = require('readline');
import uuid = require('uuid-random');
import * as child_process from 'child_process';

//--------------------------------------------
//module-internal Constants
//--------------------------------------------
const cEmptyVunitExportData : VUnitExportData = {
    export_format_version: {
        major: 1,
        minor: 0,
        patch: 0,
    },
    files: [],
    tests: [],
};

export class VUnit {

    //--------------------------------------------
	//Public Methods
	//--------------------------------------------

    public static async GetVersion(vunitScript : string): Promise<string> {
        return new Promise((resolve, reject) => {
            let version: string | undefined;
            this.Run(vunitScript, ['--version'], (vunit: ChildProcess): void => {
                let proc: any = vunit;
                readline
                    .createInterface({
                        input: proc.stdout,
                        terminal: false,
                    })
                    .on('line', (line: string) => {
                        version = line.trim();
                    });
            })
                .then(() => {
                    if(version)
                    {
                        resolve(version); 
                    }
                })
                .catch((err) => {
                    reject(new Error(err));
                });
        });
    }

    public static async FindScripts(
        workspaceFolder : vscode.WorkspaceFolder,
        makeRelativePaths : boolean = false
    ): Promise<string[]> {
        const scriptName = vscode.workspace.getConfiguration().get("vhdl-by-hgb.vunitScriptName") as string;
        let results = await vscode.workspace.findFiles(
            new vscode.RelativePattern(workspaceFolder, `**/${scriptName}`),
            '**/{vunit,examples,acceptance/artificial}/{vhdl,verilog}'
        );
        const workspacePath = this.GetWorkspaceRoot();
        let vunitScripts: string[] = results.map((file) => {
            if(makeRelativePaths && workspacePath) 
            {
                return path.relative(workspacePath, file.fsPath);
            }
            else
            {
                return file.fsPath;
            }
        });

        vunitScripts.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        return vunitScripts;
    }

    public static async Run(
        vunitScript: string,
        vunitArgs: string[],
        vunitProcess: (vunit: ChildProcess) => void = () => {},
        outputChannel?: vscode.OutputChannel
    ): Promise<string> {
        try{

            return new Promise((resolve, reject) => {
                if (!this.GetWorkspaceRoot()) {
                    return reject(new Error('Workspace root not defined.'));
                } else if (!vunitScript) {
                    return reject(
                        new Error('Unable to determine path of VUnit run script.')
                    );
                } else if (!fs.existsSync(vunitScript)) {
                    return reject(Error(`VUnit run script ${vunitScript} does not exist.`));
                }
                const python = vscode.workspace
                    .getConfiguration()
                    .get('vhdl-by-hgb.python') as string;
                const args = ['"' + vunitScript + '"'].concat(vunitArgs);
                outputChannel?.appendLine('');
                outputChannel?.appendLine('===========================================');
                outputChannel?.appendLine('Running VUnit: ' + python + ' ' + args.join(' '));
                let vunit = spawn(python, args, {
                    cwd: path.dirname(vunitScript),
                    shell: true,
                });
                vunit.on('close', (code) => {
                    if (code === 0) {
                        outputChannel?.appendLine('\nFinished with exit code 0');
                        resolve(code.toString());
                    } else {
                        let msg = `VUnit returned with non-zero exit code (${code}).`;
                        outputChannel?.appendLine('\n' + msg);
                        reject(new Error(msg));
                    }
                });
                vunitProcess(vunit);
                vunit.stdout.on('data', (data: string) => {
                    outputChannel?.append(data.toString());
                });
                vunit.stderr.on('data', (data: string) => {
                    outputChannel?.append(data.toString());
                });

            });
        }
        catch(error)
        {
            console.log(error);
        }

        return "";
    }

    public static async GetData(workDir: string, vunitScript:string, outputChannel? : vscode.OutputChannel): Promise<VUnitExportData> {
        
        const vunitJson = path.join(workDir, `${uuid()}.json`);
        fs.mkdirSync(path.dirname(vunitJson), { recursive: true });
    
        let vunitData: VUnitExportData = cEmptyVunitExportData;
        let options = ['--list', `--export-json ${vunitJson}`];
        
        await this.Run(vunitScript,options, undefined, outputChannel)
            .then(() => {
                vunitData = JSON.parse(fs.readFileSync(vunitJson, 'utf-8'));
                fs.unlinkSync(vunitJson);
            })
            .catch((err) => {
                vunitData = cEmptyVunitExportData;
                if(fs.existsSync(vunitJson))
                {
                    vunitData = JSON.parse(fs.readFileSync(vunitJson, 'utf-8'));
                    fs.unlinkSync(vunitJson);
                }
            });
        return vunitData;
    }

    public static GetWorkspaceRoot(): string | undefined {
        const workspaceFolder = (vscode.workspace.workspaceFolders || [])[0];
        let wsRoot: string | undefined = undefined;
        if (workspaceFolder) {
            wsRoot = workspaceFolder.uri.fsPath;
        }
        return wsRoot;
    }

    public static InstallVUnitHdl(IsUpdate: boolean = false, outputChannel?: vscode.OutputChannel): boolean {
        const command = IsUpdate ? ['install', '-U', 'vunit_hdl'] : ['install', 'vunit_hdl'];
        const result = child_process.spawnSync('pip', command);
        if (result.status === 0) {
            if(IsUpdate)
            {
                outputChannel?.appendLine('VUnit was updated!');
            }
            else
            {
                outputChannel?.appendLine('VUnit was installed!');
            }
            return true;
        } else {
            outputChannel?.appendLine('Failed to install VUnit!');
            return false;
        }
    }

}

function IsVUnitHdlInstalled(outputChannel? : vscode.OutputChannel): boolean {
    const result = child_process.spawnSync('pip', ['show', 'vunit_hdl']);
    if (result.status === 0) {
        const output = result.stdout.toString().trim();
        const infoLines = output.split('\n');
        outputChannel?.appendLine(`VUnit-${infoLines[1]}`);
        return true;
    }
    else
    {
        outputChannel?.appendLine('VUnit is not installed');
        return false;
    }
}

function IsPythonInstalled(outputChannel : vscode.OutputChannel): boolean
{
    //result.error === null && 
    const result = child_process.spawnSync(vscode.workspace.getConfiguration().get("vhdl-by-hgb.python") as string, ['--version']);
    if (result.status === 0) {
        const output = result.stdout.toString().trim();
        outputChannel.appendLine(`Python version: ${output}`);
        return true;
    } else {
        outputChannel.appendLine('Python is not installed.');
        return false;
    }
}