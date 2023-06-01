// Specific Imports
import { IVhdlFinder } from "./FileTools/VhdlFinder/VhdlFinder";
import { SimpleVhdlFinder } from "./FileTools/VhdlFinder/SimpleVhdlFinder";
import { FileHolder } from "./FileTools/FileHolder";
import { TomlGenerator } from "./FileTools/FileGenerator/TomlGenerator";
import { SynthesisManager } from "./VHDLtools/Synthesis/SynthesisManager";
import { SimulationManager } from "./VHDLtools/Simulation/SimulationManager";

import { DynamicSnippets } from "./DynamicSnippets/VhdlDynamicSnippets";

// General Imports
import * as vscode from 'vscode';
import * as path from 'path';

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
        this.mVhdlFinder = new SimpleVhdlFinder();
        this.mFileHolder = new FileHolder();

        this.mTomlGenerator = new TomlGenerator(this.mWorkSpacePath, this.mFileHolder);
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

    private async UpdateProjectFiles() : Promise<void> {

        this.mVhdlFinder.GetVhdlFiles(this.mWorkSpacePath).then((projectFiles) => 
        { 
            this.mFileHolder.SetProjectFiles(projectFiles);
            vscode.commands.executeCommand("VHDLbyHGB.vhdlls.deactivate")
                .then(
                    () => {this.mTomlGenerator.Generate_VHDL_LS();}
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

}