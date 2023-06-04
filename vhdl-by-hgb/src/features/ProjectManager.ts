// Specific Imports
import { IVhdlFinder } from "./FileTools/VhdlFinder/VhdlFinder";
import { SimpleVhdlFinder } from "./FileTools/VhdlFinder/SimpleVhdlFinder";
import { FileHolder } from "./FileTools/FileHolder";
import { TomlGenerator } from "./FileTools/FileGenerator/TomlGenerator";
import { SynthesisManager } from "./VHDLtools/Synthesis/SynthesisManager";
import { SimulationManager } from "./VHDLtools/Simulation/SimulationManager";
import { VunitVhdlFinder } from "./FileTools/VhdlFinder/VunitVhdlFinder";

import { DynamicSnippets } from "./DynamicSnippets/VhdlDynamicSnippets";

// General Imports
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';

export class ProjectManager {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    
    // vscode-members
    private mOutputChannel : vscode.OutputChannel;
    private mContext : vscode.ExtensionContext;
    private mProjectWatcher : vscode.FileSystemWatcher;

    // project-specific members
    private mWorkSpacePath : string = "";

    private mVhdlFinder : IVhdlFinder;
    private mTomlGenerator : TomlGenerator;

    private mFileHolder : FileHolder;
    private mSynthesisManager : SynthesisManager;
    private mSimulationManager : SimulationManager;
    
    private mDynamicSnip : DynamicSnippets;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(context: vscode.ExtensionContext, outputChannel : vscode.OutputChannel) 
    {
        if(vscode.workspace.workspaceFolders !== undefined)
        {
            this.mWorkSpacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            //set working directory to WorkSpacePath
            if(process.cwd() !== this.mWorkSpacePath && this.mWorkSpacePath.length !== 0)
            {
                process.chdir(this.mWorkSpacePath);
            }
        }

        //vs-code members
        this.mContext = context;
        this.mOutputChannel = outputChannel;

        //specific members
        this.mVhdlFinder = this.AutoSelectFileFinder();
        this.mFileHolder = new FileHolder();

        this.mTomlGenerator = new TomlGenerator();
        this.mSynthesisManager = new SynthesisManager(this.mContext, this.mFileHolder);
        this.mSimulationManager = new SimulationManager(this.mContext);

        this.mProjectWatcher = vscode.workspace.createFileSystemWatcher(path.join(this.mWorkSpacePath, "**/*.vhd"));

        //handle events for ProjectWatcher
        this.mProjectWatcher.onDidCreate( (uri) => {
            this.UpdateProjectFiles();
        });
        this.mProjectWatcher.onDidDelete( (uri) => {
            this.UpdateProjectFiles();
        });

        this.mDynamicSnip = new DynamicSnippets(this.mContext);
        this.RegisterCommands();
    }

    public Initialize() 
	{
		if(fs.existsSync(path.join(this.mWorkSpacePath, "vhdl_ls.toml")))
        {
            // only activate Language-Server at extension-start, if file-information is available
            vscode.commands.executeCommand("VHDLbyHGB.vhdlls.activate");
        }
	}

    private async UpdateProjectFiles() : Promise<void> {

        this.mVhdlFinder.GetVhdlFiles(this.mWorkSpacePath).then((projectFiles) => 
        { 
            this.mFileHolder.SetProjectFiles(projectFiles);

            vscode.commands.executeCommand("VHDLbyHGB.vhdlls.deactivate")
            .then(
                () => {this.mTomlGenerator.Generate_VHDL_LS(this.mFileHolder, this.mWorkSpacePath);}
            )
            .then(
                () => { vscode.commands.executeCommand("VHDLbyHGB.vhdlls.activate"); }
            );
        });
    }

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private RegisterCommands() : void
    {
        let disposable : vscode.Disposable;

        disposable = vscode.commands.registerCommand("VHDLbyHGB.ProjectManager.UpdateFiles", () => this.UpdateProjectFiles());
        this.mContext.subscriptions.push(disposable);
    }

    private AutoSelectFileFinder() : IVhdlFinder
    {
        let vhdlFinder : IVhdlFinder;

        if(!this.IsPythonInstalled())
        {
            vhdlFinder = new SimpleVhdlFinder();
            vscode.window.showInformationMessage("Install python for advanced library-mapping");
        }
        else
        {

            if(this.IsVunitHdlInstalled())
            {
                vhdlFinder = new VunitVhdlFinder();
            }
            else
            {
                if(this.InstallVunitHdl())
                {
                    vscode.window.showInformationMessage("VUnit was installed successfully!");
                    vhdlFinder = new VunitVhdlFinder();
                }
                else
                {
                    vhdlFinder = new SimpleVhdlFinder();
                }
            }          
        }

        return vhdlFinder;
    }

    private IsPythonInstalled(): boolean
    {
        //result.error === null && 
        const result = child_process.spawnSync('python', ['--version']);
        if (result.status === 0) {
            const output = result.stdout.toString().trim();
            this.mOutputChannel.appendLine(`Python version: ${output}`);
            return true;
        } else {
            this.mOutputChannel.appendLine('Python is not installed.');
            return false;
        }
    }

    private IsVunitHdlInstalled(): boolean {
        const result = child_process.spawnSync('pip', ['show', 'vunit_hdl']);
        if (result.status === 0) {
            const output = result.stdout.toString().trim();
            const infoLines = output.split('\n');
            this.mOutputChannel.appendLine(`VUnit-${infoLines[1]}`);
            return true;
        }
        else
        {
            this.mOutputChannel.appendLine('VUnit is not installed');
            return false;
        }
    }

    private InstallVunitHdl(IsUpdate: boolean = false): boolean {
        const command = IsUpdate ? ['install', '-U', 'vunit_hdl'] : ['install', 'vunit_hdl'];
        const result = child_process.spawnSync('pip', command);
        if (result.error === null && result.status === 0) {
            this.mOutputChannel.appendLine('VUnit was updated');
            return true;
        } else {
            this.mOutputChannel.appendLine('Failed to install VUnit!');
            return false;
        }
    }

}