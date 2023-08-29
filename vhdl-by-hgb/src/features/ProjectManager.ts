// specific imports
import { IVhdlFinder } from "./FileTools/VhdlFinder/VhdlFinder";
import { FileHolder } from "./FileTools/FileHolder";
import { TomlGenerator } from "./FileTools/FileGenerator/TomlGenerator";
import { SynthesisManager } from "./VHDLtools/Synthesis/SynthesisManager";
import { SimulationManager } from "./VHDLtools/Simulation/SimulationManager";
import { HDLUtils } from "./FileTools/HDLUtils";
import { DynamicSnippets } from "./DynamicSnippets/VhdlDynamicSnippets";

// general imports
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
    private mProjectIsInitialised : boolean = false;

    private mVhdlFinder! : IVhdlFinder;

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

        this.mFileHolder = new FileHolder();

        this.mSynthesisManager = new SynthesisManager(this.mContext, this.mFileHolder);
        this.mSimulationManager = new SimulationManager(this.mContext);

        this.mDynamicSnip = new DynamicSnippets(this.mContext);

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
        this.mSynthesisManager.Initialize();
	}

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private async Setup() : Promise<void>
    {
        if(!this.mProjectIsInitialised)
        {
            // only activate Language-Server once
            vscode.commands.executeCommand("VHDLbyHGB.vhdlls.activate");
        }

        //set flag for intialized hdl-project to true
        this.mProjectIsInitialised = true;

        this.mVhdlFinder = this.mSimulationManager.GetVhdlFinder();
        this.Update();

    }

    private async Update() : Promise<void> 
    {
        if(this.mProjectIsInitialised)
        {
            this.mVhdlFinder.GetVhdlFiles(this.mWorkSpacePath).then((projectFiles) => 
            {
                if(projectFiles.size !== 0)
                {
                    this.mFileHolder.SetProjectFiles(projectFiles);
                    TomlGenerator.Generate_VHDL_LS(this.mFileHolder, this.mWorkSpacePath);
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
                return HDLUtils.IsVhdlFile(filePath);
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
                return HDLUtils.IsVhdlFile(filePath);
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
                return  HDLUtils.IsVhdlFile(oldFilePath) ||
                        HDLUtils.IsVhdlFile(newFilePath);
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