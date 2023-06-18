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

    // project-specific members
    private mWorkSpacePath : string = "";
    private mIsProjectInitialised : boolean = false;

    private mVhdlFinderFactory : VhdlFinderFactory;
    private mVhdlFinder! : IVhdlFinder;
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
        this.mFileHolder = new FileHolder();

        this.mTomlGenerator = new TomlGenerator();
        this.mSynthesisManager = new SynthesisManager(this.mContext, this.mFileHolder);
        this.mSimulationManager = new SimulationManager(this.mContext);

        this.HandleFileEvents();
        this.RegisterCommands();
    }

    public async Initialize() : Promise<void>
	{
		if(fs.existsSync(path.join(this.mWorkSpacePath, "vhdl_ls.toml")))
        {
            //load existing HDL-project
            this.Setup();
        }

        this.mSimulationManager.Initialize();
	}

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private async Setup() : Promise<void>
    {
        if(!this.mIsProjectInitialised)
        {
            // only activate Language-Server once
            vscode.commands.executeCommand("VHDLbyHGB.vhdlls.activate");
        }

        //set flag for intialized hdl-project to true
        this.mIsProjectInitialised = true;

        this.mVhdlFinder = this.mVhdlFinderFactory.CreateVhdlFinder();
        this.Update();

    }

    private RefreshVhdlFinder() : void
    {
        this.mVhdlFinder = this.mVhdlFinderFactory.CreateVhdlFinder();
    }

    private async Update() : Promise<void> 
    {
        if(this.mIsProjectInitialised)
        {
            this.mVhdlFinder.GetVhdlFiles(this.mWorkSpacePath).then((projectFiles) => 
            {
                if(projectFiles.size !== 0)
                {
                    this.mFileHolder.SetProjectFiles(projectFiles);
                    this.mTomlGenerator.Generate_VHDL_LS(this.mFileHolder, this.mWorkSpacePath);
                }
            });
        }
    }

    private async HandleFileEvents() : Promise<void>
    {
        vscode.workspace.onDidCreateFiles((event) => 
        {
            const containsVhdlFile : boolean = event.files.some((file) => {
                const filePath = file.fsPath.toLowerCase();
                return filePath.endsWith('.vhd') || filePath.endsWith('.vhdl');
            });
            if(containsVhdlFile)
            {
                this.Update();
            }
        });

        vscode.workspace.onDidDeleteFiles((event) => 
        {
            const containsVhdlFile : boolean = event.files.some((file) => {
                const filePath = file.fsPath.toLowerCase();
                return filePath.endsWith('.vhd') || filePath.endsWith('.vhdl');
            });
            if(containsVhdlFile)
            {
                this.Update();
            }
        });

        vscode.workspace.onDidRenameFiles((event) => 
        {
            const containsVhdlFile : boolean = event.files.some((file) => {
                const oldFilePath = file.oldUri.fsPath.toLowerCase();
                const newFilePath = file.newUri.fsPath.toLowerCase();
                return  oldFilePath.endsWith('.vhd')   || 
                        oldFilePath.endsWith('.vhdl')  ||
                        newFilePath.endsWith('.vhd')   || 
                        newFilePath.endsWith('.vhdl');
            });
            if(containsVhdlFile)
            {
                this.Update();
            }
        });
    }

    private RegisterCommands() : void
    {
        let disposable : vscode.Disposable;

        disposable = vscode.commands.registerCommand("VHDLbyHGB.ProjectManager.Setup", () => this.Setup());
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.ProjectManager.Update", () => this.Update());
        this.mContext.subscriptions.push(disposable);
    }

    

    

}