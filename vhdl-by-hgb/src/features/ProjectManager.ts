// specific imports
import { IVhdlFinder } from "./FileTools/VhdlFinder/VhdlFinder";
import { FileHolder } from "./FileTools/FileHolder";
import { TomlGenerator } from "./FileTools/FileGenerator/TomlGenerator";
import { ProjectViewProvider } from "./TreeView/Project/ProjectView";
import { SynthesisViewProvider } from "./TreeView/Synthesis/SynthesisView";
import { Quartus } from "./VHDLtools/Synthesis/Quartus/Quartus";

// General Imports
import * as vscode from 'vscode';
import { SynthesisManager } from "./VHDLtools/Synthesis/SynthesisManager";
import { SimulationManager } from "./VHDLtools/Simulation/SimulationManager";
import { HDLUtils } from "./FileTools/HDLUtils";
import { DynamicSnippets } from "./DynamicSnippets/VhdlDynamicSnippets";

// general imports
import * as path from 'path';
import * as fs from 'fs';
import { RustHDL } from "./RustHDL";

//module-internal types
enum eTomlGenerationKind {
    auto,
    manual
}

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
    private mResourcePath : string = "";

	private mRustHDL : RustHDL; // Language-Server (LSP)
    private mVhdlFinder! : IVhdlFinder;

    private mFileHolder : FileHolder;
    private mDynamicSnip : DynamicSnippets;

    private mSynthesisManager : SynthesisManager;
    private mSimulationManager : SimulationManager;

    // UI
    private mProjectViewProvider : ProjectViewProvider;


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

        //project-specific members
		this.mRustHDL = new RustHDL(this.mContext);
        this.mFileHolder = new FileHolder();

        this.mDynamicSnip = new DynamicSnippets(this.mContext);
        
        this.mSynthesisManager = new SynthesisManager(this.mWorkSpacePath, this.mContext);
        this.mSimulationManager = new SimulationManager(this.mContext);

        // UI
        this.mProjectViewProvider = new ProjectViewProvider(this.mFileHolder, this.mContext, this.mWorkSpacePath);
        vscode.window.createTreeView(
            'vhdlbyhgb-view-project',{
            treeDataProvider: this.mProjectViewProvider
        });

        this.HandleFileEvents();
        this.RegisterCommands();
    }

    public async Initialize() : Promise<void>
	{
        await this.mSimulationManager.Initialize();
        await this.mSynthesisManager.Initialize();
        
		if(fs.existsSync(path.join(this.mWorkSpacePath, "vhdl_ls.toml")))
        {
            //load existing HDL-project
            this.Setup();
        }

        this.connectEvents();
	}

    public Deactivate() : Thenable<void> | undefined
    {
		return this.mRustHDL.Deactivate();
    }

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private async Setup() : Promise<void>
    {
        if(!this.mProjectIsInitialised)
        {
            // only activate Language-Server once
            this.mRustHDL.Activate();
        }

        //set flag for intialized hdl-project to true
        this.mProjectIsInitialised = true;

        // tool for getting sources of a hdl-project
        this.mVhdlFinder = this.mSimulationManager.GetVhdlFinder();

        // updating project-data
        this.Update();

    }

    private async Update() : Promise<void> 
    {
        if(!this.mProjectIsInitialised)
        {
            return;
        }

        const tomlGenerationKind = vscode.workspace.getConfiguration().get("vhdl-by-hgb.vhdlls.toml.generation");
        let tomlGenKind = tomlGenerationKind as keyof typeof eTomlGenerationKind;

        switch(tomlGenKind)
        {
            case "manual":
                // do not generate vhdl_ls.toml automatically with this option.
                // the user will generate it itself
                return;

            case "auto":
                const projectFiles = await this.mVhdlFinder.GetVhdlFiles(this.mWorkSpacePath);
                if(projectFiles.size !== 0)
                {
                    this.mFileHolder.SetProjectFiles(projectFiles);
                    TomlGenerator.Generate_VHDL_LS(this.mFileHolder, this.mWorkSpacePath);
                }
        }
;
    }

    private connectEvents() : void
    {
        let disposable : vscode.Disposable;

        //connect events
        disposable = this.mSimulationManager.ActiveSimulationProjectChanged.event(()  => this.Setup());
        this.mContext.subscriptions.push(disposable);
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

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Project.Setup", () => this.Setup());
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Project.Update", () => this.Update());
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand("VHDLbyHGB.Project.View.Refresh", () => this.mProjectViewProvider.refresh());
        this.mContext.subscriptions.push(disposable);
    }

}