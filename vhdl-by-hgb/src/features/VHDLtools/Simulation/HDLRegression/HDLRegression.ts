//use
'use strict';

//specific imports

//general imports
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ChildProcess, spawn } from 'child_process';
import readline = require('readline');
import { HDLRegressionData, HDLRegressionFile, HDLRegressionTest } from './HDLRegressionPackage';

//module-internal constants
const cHDLRegressionLtcMatcher : RegExp = /^TC:(\d+)\s+-\s+(\w+)\.(\w+)\.(\w+)/;
const cHDLRegressionLibraryMatcher: RegExp = /\|\-\-\[(\d+)\]\-\-\s+([^(]+)(?![^(]*\))/;
const cHDLRegressionFileMatcher: RegExp = /\|---\s(.+?(?:\.\w+)?)\s*(?=\()/;


export class HDLRegression {

    //--------------------------------------------
	//Private Members
	//--------------------------------------------
    private mOutputChannel : vscode.OutputChannel;

    //--------------------------------------------
	//Public Methods
	//--------------------------------------------
    public constructor(outputChannel : vscode.OutputChannel) {
        this.mOutputChannel = outputChannel;
    }

    public async FindScripts(
        workspaceFolder: vscode.WorkspaceFolder,
        makeRelativePaths : boolean = false
    ): Promise<string[]> {

        const HDLRegressionScriptName : string = vscode.workspace.getConfiguration().get("vhdl-by-hgb.hdlregressionScriptName") as string;

        let results = await vscode.workspace.findFiles(
            new vscode.RelativePattern(workspaceFolder, `**/${HDLRegressionScriptName}`),
        );

        const workspacePath = this.GetWorkspaceRoot();

        let hdlRegressionScripts : string[] = results.map((file) => {
            if(makeRelativePaths && workspacePath) 
            {
                return path.relative(workspacePath, file.fsPath);
            }
            else
            {
                return file.fsPath;
            }
        });

        hdlRegressionScripts.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        return hdlRegressionScripts;
    }

    public async Run(
        hdlregressionScript: string,
        hdlregressionArgs: string[],
        hdlregressionProcess: (hdlregression: ChildProcess) => void = () => {}
    ): Promise<string> {
        try{

            return new Promise((resolve, reject) => {
                if (!this.GetWorkspaceRoot()) {
                    return reject(new Error('Workspace root not defined.'));
                } else if (!hdlregressionScript) {
                    return reject(
                        new Error('Unable to determine path of HDLRegression run script.')
                    );
                } else if (!fs.existsSync(hdlregressionScript)) {
                    return reject(Error(`HDLRegression script ${hdlregressionScript} does not exist.`));
                }
                const python = vscode.workspace
                    .getConfiguration()
                    .get('hdlregression-by-hgb.python') as string;
                const args = ['"' + hdlregressionScript + '"'].concat(hdlregressionArgs);
                this.mOutputChannel.appendLine('');
                this.mOutputChannel.appendLine('===========================================');
                this.mOutputChannel.appendLine('Running HDLRegression: ' + python + ' ' + args.join(' '));
                let hdlregression = spawn(python, args, {
                    cwd: path.dirname(hdlregressionScript),
                    shell: true,
                });
                hdlregression.on('close', (code) => {
                    if (code === 0) {
                        this.mOutputChannel.appendLine('\nFinished with exit code 0');
                        resolve(code.toString());
                    } else {
                        let msg = `HDLRegression returned with non-zero exit code (${code}).`;
                        this.mOutputChannel.appendLine('\n' + msg);
                        reject(new Error(msg));
                    }
                });
                hdlregressionProcess(hdlregression);
                hdlregression.stdout.on('data', (data: string) => {
                    this.mOutputChannel.append(data.toString());
                });
                hdlregression.stderr.on('data', (data: string) => {
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

    public async GetData(hdlregressionScript : string): Promise<HDLRegressionData> 
    {

        const testcases : HDLRegressionTest[] = await this.GetTestcases(hdlregressionScript);
        const files : HDLRegressionFile[] = await this.GetFiles(hdlregressionScript);
        
        const data : HDLRegressionData =
        {
            files : files,
            tests : testcases
        };

        return data;
    }


    public async GetTestcases(hdlregressionScript : string): Promise<HDLRegressionTest[]> {
        
        const options = ['-ltc'];

        let HDLRegressionTestCases : HDLRegressionTest[] = new Array<HDLRegressionTest>();
        let hdlregressionProcess : any;

        await this.Run(hdlregressionScript, options, (hdlregression: ChildProcess) => {

            hdlregressionProcess = hdlregression;
            
            readline
                .createInterface({
                    input: hdlregressionProcess.stdout,
                    terminal: false,
                })
                .on('line', (line: string) => 
                {
                    const HDLRegressionTestCase = cHDLRegressionLtcMatcher.exec(line);

                    if(HDLRegressionTestCase)
                    {
                        const testCaseID = parseInt(HDLRegressionTestCase[1]);
                        const testBench = HDLRegressionTestCase[2];
                        const testCaseArchitecture = HDLRegressionTestCase[3];
                        const testCaseName = HDLRegressionTestCase[4];

                        const regressionTestCase : HDLRegressionTest =
                        {
                            testcase_id : testCaseID,
                            testbench : testBench,
                            architecture : testCaseArchitecture,
                            name : testCaseName
                        };

                        HDLRegressionTestCases.push(regressionTestCase);
                    }
                });
            
            });
            
        return HDLRegressionTestCases;
    }

    public async GetFiles(hdlregressionScript : string): Promise<HDLRegressionFile[]> {
        
        const options = ['-lco'];

        let HDLRegressionFiles : HDLRegressionFile[] = new Array<HDLRegressionFile>();
        let hdlregressionProcess : any;

        let currentLibrary : string;

        await this.Run(hdlregressionScript, options, (hdlregression: ChildProcess) => {

            hdlregressionProcess = hdlregression;
            
            readline
                .createInterface({
                    input: hdlregressionProcess.stdout,
                    terminal: false,
                })
                .on('line', (line: string) => 
                {
                    const HDLRegressionLibrary = cHDLRegressionLibraryMatcher.exec(line);

                    if(HDLRegressionLibrary)
                    {
                        currentLibrary = HDLRegressionLibrary[2].trim();
                    }

                    const HDLRegressionFile = cHDLRegressionFileMatcher.exec(line);

                    if(HDLRegressionFile)
                    {
                        let fileName : string = HDLRegressionFile[1].trim();
                        const isTestbench : boolean = HDLRegressionFile[1].includes("(TB)");
                        fileName = isTestbench ? fileName.replace("(TB)", "").trim() : fileName;

                        const regressionFile : HDLRegressionFile =
                        {
                            file_name: fileName,
                            library_name: currentLibrary,
                            is_testbench: isTestbench
                        };

                        HDLRegressionFiles.push(regressionFile);
                    }
                });
            
            });
            
        return HDLRegressionFiles;
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
