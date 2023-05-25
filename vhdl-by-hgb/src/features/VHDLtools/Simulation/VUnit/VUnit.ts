//use
'use strict';

//specific imports
import {VunitExportData} from './VUnitPackage';

//general imports
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ChildProcess, spawn } from 'child_process';
import kill = require('tree-kill');
import readline = require('readline');
import uuid = require('uuid-random');

//--------------------------------------------
//module-internal Constants
//--------------------------------------------
const cEmptyVunitExportData : VunitExportData = {
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
	//Private Members
	//--------------------------------------------
    private mOutputChannel : vscode.OutputChannel;

    //--------------------------------------------
	//Public Methods
	//--------------------------------------------
    public constructor() {
        this.mOutputChannel = vscode.window.createOutputChannel("VHDLbyHGB.VUnit");
    }

    public async GetVunitVersion(runPy : string): Promise<string> {
        return new Promise((resolve, reject) => {
            let version: string | undefined;
            this.RunVunit(runPy, ['--version'], (vunit: ChildProcess): void => {
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

    public async FindRunPy(
        workspaceFolder: vscode.WorkspaceFolder
    ): Promise<string[]> {
        let results = await vscode.workspace.findFiles(
            new vscode.RelativePattern(workspaceFolder, '**/run.py'),
            '**/{vunit,examples,acceptance/artificial}/{vhdl,verilog}'
        );
        let runPy: string[] = results.map((file) => {
            return file.fsPath;
        });
        return runPy;
    }

    public async RunVunit(
        runPy: string,
        vunitArgs: string[],
        vunitProcess: (vunit: ChildProcess) => void = () => {}
    ): Promise<string> {
        try{

            return new Promise((resolve, reject) => {
                if (!this.GetWorkspaceRoot()) {
                    return reject(new Error('Workspace root not defined.'));
                } else if (!runPy) {
                    return reject(
                        new Error('Unable to determine path of VUnit run script.')
                    );
                } else if (!fs.existsSync(runPy)) {
                    return reject(Error(`VUnit run script ${runPy} does not exist.`));
                }
                const python = vscode.workspace
                    .getConfiguration()
                    .get('vhdl-by-hgb.python') as string;
                const args = ['"' + runPy + '"'].concat(vunitArgs);
                this.mOutputChannel.appendLine('');
                this.mOutputChannel.appendLine('===========================================');
                this.mOutputChannel.appendLine('Running VUnit: ' + python + ' ' + args.join(' '));
                let vunit = spawn(python, args, {
                    cwd: path.dirname(runPy),
                    shell: true,
                });
                vunit.on('close', (code) => {
                    if (code === 0) {
                        this.mOutputChannel.appendLine('\nFinished with exit code 0');
                        resolve(code.toString());
                    } else {
                        let msg = `VUnit returned with non-zero exit code (${code}).`;
                        this.mOutputChannel.appendLine('\n' + msg);
                        reject(new Error(msg));
                    }
                });
                vunitProcess(vunit);
                vunit.stdout.on('data', (data: string) => {
                    this.mOutputChannel.append(data.toString());
                });
                vunit.stderr.on('data', (data: string) => {
                    this.mOutputChannel.append(data.toString());
                });

            });
        }
        catch(error)
        {
            console.log(error);
        }

        return "";
    }

    public async GetVunitData(workDir: string, runPy:string): Promise<VunitExportData> {
        
        const vunitJson = path.join(workDir, `${uuid()}.json`);
        fs.mkdirSync(path.dirname(vunitJson), { recursive: true });
    
        let vunitData: VunitExportData = cEmptyVunitExportData;
        let options = ['--list', `--export-json ${vunitJson}`];
        
        await this.RunVunit(runPy,options)
            .then(() => {
                vunitData = JSON.parse(fs.readFileSync(vunitJson, 'utf-8'));
                fs.unlinkSync(vunitJson);
            })
            .catch((err) => {
                vunitData = cEmptyVunitExportData;
            });
        return vunitData;
    }

    public GetWorkspaceRoot(): string | undefined {
        const workspaceFolder = (vscode.workspace.workspaceFolders || [])[0];
        let wsRoot: string | undefined = undefined;
        if (workspaceFolder) {
            wsRoot = workspaceFolder.uri.fsPath;
        }
        return wsRoot;
    }


}

