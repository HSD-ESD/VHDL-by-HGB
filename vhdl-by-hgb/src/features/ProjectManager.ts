// Specific Imports
import { VHDL_ProjectFiles, VHDL_Library, VHDL_Files} from "../Constants";
import { IVhdlFinder } from "./FileTools/VhdlFinder/VhdlFinder";
import { SimpleVhdlFinder } from "./FileTools/VhdlFinder/SimpleVhdlFinder";
import { FileHolder } from "./FileTools/FileHolder";
import { TomlGenerator } from "./FileTools/FileGenerator/TomlGenerator";
import { Quartus } from "./VHDLtools/Synthesis/Quartus/Quartus";

// General Imports
import * as vscode from 'vscode';
import { SynthesisManager } from "./VHDLtools/Synthesis/SynthesisManager";

export class ProjectManager {

    // --------------------------------------------
    // Private members
    // --------------------------------------------

    // vscode-members
    private mOutputChannel : vscode.OutputChannel;
    private mContext : vscode.ExtensionContext;

    // project-specific members
    private mWorkSpacePath : string = "";

    private mVhdlFinder : IVhdlFinder;
    private mTomlGenerator : TomlGenerator;

    private mFileHolder : FileHolder;
    private mSynthesisManager : SynthesisManager;
    
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

        this.mVhdlFinder = new SimpleVhdlFinder();
        this.mFileHolder = new FileHolder();

        this.mTomlGenerator = new TomlGenerator(this.mWorkSpacePath, this.mFileHolder);
        this.mSynthesisManager = new SynthesisManager(this.mContext, this.mFileHolder);

        this.RegisterCommands();
    }

    public async UpdateProjectFiles() : Promise<void> {
        this.mVhdlFinder.GetVhdlFilesFromProject(this.mWorkSpacePath).then((projectFiles) => 
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