// Specific Imports
import { IVhdlFinder } from "./FileTools/VhdlFinder/VhdlFinder";
import { VhdlFinderFactory } from "./FileTools/VhdlFinder/VhdlFinderFactory";
import { FileHolder } from "./FileTools/FileHolder";
import { TomlGenerator } from "./FileTools/FileGenerator/TomlGenerator";
import { SynthesisManager } from "./VHDLtools/Synthesis/SynthesisManager";
import { SimulationManager } from "./VHDLtools/Simulation/SimulationManager";

import { ACTIVE_SIMULATION_PROJECT } from "./VHDLtools/Simulation/SimulationPackage";

import { DynamicSnippets } from "./DynamicSnippets/VhdlDynamicSnippets";

// General Imports
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
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

    private mVhdlFinderFactory : VhdlFinderFactory;
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
        this.mVhdlFinderFactory = new VhdlFinderFactory(this.mContext, this.mOutputChannel);
        this.mVhdlFinder = this.mVhdlFinderFactory.CreateVhdlFinder();
        this.mFileHolder = new FileHolder();

        this.mTomlGenerator = new TomlGenerator();
        this.mSynthesisManager = new SynthesisManager(this.mContext, this.mFileHolder);
        this.mSimulationManager = new SimulationManager(this.mContext);

        this.mProjectWatcher = vscode.workspace.createFileSystemWatcher(path.join(this.mWorkSpacePath, "**/*.vhd"));

        //handle events for ProjectWatcher
        this.mProjectWatcher.onDidCreate( (uri) => {
            this.Update();
        });
        this.mProjectWatcher.onDidDelete( (uri) => {
            this.Update();
        });

        this.mDynamicSnip = new DynamicSnippets(this.mContext);
        this.RegisterCommands();
    }

    public async Initialize() : Promise<void>
	{
		if(fs.existsSync(path.join(this.mWorkSpacePath, "vhdl_ls.toml")))
        {
            // only activate Language-Server at extension-start, if file-information is available
            vscode.commands.executeCommand("VHDLbyHGB.vhdlls.activate");
        }

        this.mSimulationManager.Initialize();
        this.Update();
	}

    private async Update() : Promise<void> {

        this.mVhdlFinder.GetVhdlFiles(this.mWorkSpacePath).then((projectFiles) => 
        { 
            this.mFileHolder.SetProjectFiles(projectFiles);

            this.mTomlGenerator.Generate_VHDL_LS(this.mFileHolder, this.mWorkSpacePath);
        });
    }

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private RefreshVhdlFinder() : void
    {
        this.mVhdlFinder = this.mVhdlFinderFactory.CreateVhdlFinder();
    }

    private RegisterCommands() : void
    {
        let disposable : vscode.Disposable;

        disposable = vscode.commands.registerCommand("VHDLbyHGB.ProjectManager.Update", () => this.Update());
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.ProjectManager.RefreshVhdlFinder", () => this.RefreshVhdlFinder());
        this.mContext.subscriptions.push(disposable);
    }

    

    

}