// specific imports
import { ISourceFinder } from "../utils/hdl/source_finder/source_finder";
import { SourceManager } from "./source_manager";
import { TomlUtils } from "../utils/toml/toml_utils";
import { ProjectViewProvider, ProjectItem} from '../ui/tree_view/project/project_view';
import { SynthesisManager } from "../hdl_tools/synthesis/synthesis_manager";
import { VerificationManager } from "../hdl_tools/verification/verification_manager";
import { HDLUtils } from "../utils/hdl/general/hdl_utils";
import { DynamicSnippets } from "../editor/dynamic_snippets/vhdl_dynamic_snippets";
import { VHDL_LS } from "../lsp/vhdl_ls";
import { vhdl_ls } from "../lsp/vhdl_ls_package";
import { VhdlProjectFiles } from "../hdl_tools/vhdl_package";

// general imports
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

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

	private mVHDL_LS : VHDL_LS; // Language-Server (LSP)
    private mVhdlFinder! : ISourceFinder;

    private mFileHolder : SourceManager;
    private mDynamicSnip : DynamicSnippets;

    private mSynthesisManager : SynthesisManager;
    private mVerificationManager : VerificationManager;

    // UI
    private mProjectViewProvider : ProjectViewProvider;
    private mProjectView : vscode.TreeView<ProjectItem>;

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
		this.mVHDL_LS = new VHDL_LS(this.mContext);
        this.mFileHolder = new SourceManager();

        this.mDynamicSnip = new DynamicSnippets(this.mContext);
        
        this.mSynthesisManager = new SynthesisManager(this.mWorkSpacePath, this.mContext);
        this.mVerificationManager = new VerificationManager(this.mContext);

        // UI
        this.mProjectViewProvider = new ProjectViewProvider(this.mFileHolder, this.mContext, this.mWorkSpacePath);
        this.mProjectView = vscode.window.createTreeView<ProjectItem>(
            'vhdlbyhgb-view-project',{
            treeDataProvider: this.mProjectViewProvider
        });

        this.HandleFileEvents();
        this.RegisterCommands();
    }

    public async Initialize() : Promise<void>
	{
        const IntializationPromises : Promise<void>[] = [];
        IntializationPromises.push(this.mVerificationManager.Initialize());
        IntializationPromises.push(this.mSynthesisManager.Initialize());
        await Promise.all(IntializationPromises);
        
		if(fs.existsSync(path.join(this.mWorkSpacePath, vhdl_ls.VHDL_LS_FILE)))
        {
            //load existing HDL-project
            this.Setup();
        }

        this.connectEvents();
	}

    public Deactivate() : Thenable<void> | undefined
    {
		return this.mVHDL_LS.Deactivate();
    }

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private async Setup() : Promise<void>
    {
        if(!this.mProjectIsInitialised)
        {
            // only activate Language-Server once
            this.mVHDL_LS.Activate();
        }

        //set flag for intialized hdl-project to true
        this.mProjectIsInitialised = true;

        // tool for getting sources of a hdl-project
        this.mVhdlFinder = this.mVerificationManager.GetVhdlFinder();

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
            {
                // do not generate vhdl_ls.toml automatically with this option.
                // the user will generate it itself.
                // therefore, the vhdl_ls.toml is parsed
                const projectFiles = TomlUtils.Parse_VHDL_LS(path.join(this.mWorkSpacePath, vhdl_ls.VHDL_LS_FILE));
                this.mFileHolder.SetProjectFiles(projectFiles);
                break;
            }
            case "auto":
            {
                const projectFiles = await this.mVhdlFinder.GetVhdlFiles(this.mWorkSpacePath);
                if(projectFiles.size !== 0)
                {
                    filter_files(projectFiles);
                    mark_third_party_libraries(projectFiles);
                    this.mFileHolder.SetProjectFiles(projectFiles);
                    TomlUtils.Generate_VHDL_LS(this.mFileHolder, this.mWorkSpacePath);
                }
                break;
            }
        }

    }

    private connectEvents() : void
    {
        let disposable : vscode.Disposable;

        //connect events
        disposable = this.mVerificationManager.ActiveVerificationProjectChanged.event(()  => this.Setup());
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

            if(!containsVhdlFile) { return; }
            const tomlGenerationKind = vscode.workspace.getConfiguration().get("vhdl-by-hgb.vhdlls.toml.generation");
            let tomlGenKind = tomlGenerationKind as keyof typeof eTomlGenerationKind;
            if (tomlGenKind !== "auto") { return; }

            this.Update();

        });

        vscode.workspace.onDidDeleteFiles((event) => 
        {
            const containsVhdlFile : boolean = event.files.some((file) => {
                const filePath = file.fsPath.toLowerCase();
                return HDLUtils.IsVhdlFile(filePath);
            });

            if(!containsVhdlFile) { return; }
            const tomlGenerationKind = vscode.workspace.getConfiguration().get("vhdl-by-hgb.vhdlls.toml.generation");
            let tomlGenKind = tomlGenerationKind as keyof typeof eTomlGenerationKind;
            if (tomlGenKind !== "auto") { return; }

            this.Update();
        });

        vscode.workspace.onDidRenameFiles((event) => 
        {
            const containsVhdlFile : boolean = event.files.some((file) => {
                const oldFilePath = file.oldUri.fsPath.toLowerCase();
                const newFilePath = file.newUri.fsPath.toLowerCase();
                return  HDLUtils.IsVhdlFile(oldFilePath) ||
                        HDLUtils.IsVhdlFile(newFilePath);
            });
            
            if(!containsVhdlFile) { return; }
            const tomlGenerationKind = vscode.workspace.getConfiguration().get("vhdl-by-hgb.vhdlls.toml.generation");
            let tomlGenKind = tomlGenerationKind as keyof typeof eTomlGenerationKind;
            if (tomlGenKind !== "auto") { return; }

            this.Update();
        });

        vscode.workspace.onDidChangeTextDocument((event) => {
            const isTOML : boolean = path.basename(event.document.uri.fsPath) === vhdl_ls.VHDL_LS_FILE;
            if(!isTOML) { return; }

            const tomlGenerationKind = vscode.workspace.getConfiguration().get("vhdl-by-hgb.vhdlls.toml.generation");
            let tomlGenKind = tomlGenerationKind as keyof typeof eTomlGenerationKind;
            if (tomlGenKind !== "manual") { return; }

            this.Update();
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

function filter_files(projectFiles : VhdlProjectFiles)
{
    const excluded_file_extensions = vscode.workspace.getConfiguration().get("vhdl-by-hgb.vhdlls.toml.auto.exclude") as string[] | undefined;

    if (!excluded_file_extensions) {
        return;
    }

    if (excluded_file_extensions.length < 1) {
        return;
    }
    
    for (const [libraryName, libraryContents] of projectFiles.entries())
    {
        libraryContents.files = libraryContents.files.filter(file => {
            for (const file_extension of excluded_file_extensions)
            {
                return !file.endsWith(file_extension);
            }
        });
    }
}

function mark_third_party_libraries(projectFiles : VhdlProjectFiles)
{
    const third_party_libraries = vscode.workspace.getConfiguration().get("vhdl-by-hgb.vhdlls.toml.auto.third-party-libraries") as string[] | undefined;

    if (!third_party_libraries) {
        return;
    }

    if (third_party_libraries.length < 1) {
        return;
    }

    for (const [libraryName, libraryContents] of projectFiles.entries())
    {
        for (const third_party_lib of third_party_libraries)
        {
            if (libraryName.includes(third_party_lib))
            {
                libraryContents.is_third_party = true;
            }
        }
    }
}
