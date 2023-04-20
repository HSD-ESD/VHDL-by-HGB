// Specific Imports
import { VHDL_ProjectFiles, VHDL_Library, VHDL_Files} from "../Constants";
import { IVhdlFinder } from "./FileTools/VhdlFinder/VhdlFinder";
import { SimpleVhdlFinder } from "./FileTools/VhdlFinder/SimpleVhdlFinder";
import { FileHolder } from "./FileTools/FileHolder";
import { TomlGenerator } from "./FileTools/FileGenerator/TomlGenerator";
import { Quartus } from "./VHDLtools/Synthesis/Quartus";

// General Imports
import * as vscode from 'vscode';

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
    private mQuartus : Quartus;
    
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

        this.mContext = context;
        this.mOutputChannel = outputChannel;
        this.mFileHolder = new FileHolder();
        this.mVhdlFinder = new SimpleVhdlFinder();
        this.mTomlGenerator = new TomlGenerator(this.mWorkSpacePath, this.mFileHolder);
        this.mQuartus = new Quartus(this.mFileHolder, this.mOutputChannel, this.mContext);

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