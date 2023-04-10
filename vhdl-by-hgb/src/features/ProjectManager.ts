// Specific Imports
import { VHDL_ProjectFiles, VHDL_Library, VHDL_Files} from "../Constants";
import { VhdlFinder } from "./FileTools/VhdlFinder/VhdlFinder";
import { SimpleVhdlFinder } from "./FileTools/VhdlFinder/SimpleVhdlFinder";
import { FileHolder } from "./FileTools/FileHolder";
import { TomlGenerator } from "./FileTools/TomlGenerator";

// General Imports
import * as vscode from 'vscode';

export class ProjectManager {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mWorkSpacePath : string = "";
    private mVhdlFinder : VhdlFinder;
    private mTomlGenerator : TomlGenerator;
    private mFileHolder : FileHolder;
    
    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor() 
    {
        if(vscode.workspace.workspaceFolders !== undefined)
        {
            this.mWorkSpacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        }

        this.mFileHolder = new FileHolder();
        this.mVhdlFinder = new SimpleVhdlFinder();
        this.mTomlGenerator = new TomlGenerator();
    }

    public UpdateProjectFiles() : void {
        this.mVhdlFinder.GetVhdlFilesFromProject(this.mWorkSpacePath).then((projectFiles) => 
        { 
            this.mFileHolder.SetProjectFiles(projectFiles);
            this.mTomlGenerator
        });
    }


}