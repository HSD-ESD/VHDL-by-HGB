// Specific Imports
import { VHDL_ProjectFiles, VHDL_Library, VHDL_Files} from "../Constants";
import { VhdlFinder } from "./FileTools/VhdlFinder/VhdlFinder";
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
    private mWorkSpacePath : string = "";
    private mVhdlFinder : VhdlFinder;
    private mTomlGenerator : TomlGenerator;
    private mFileHolder : FileHolder;

    private mQuartus : Quartus;
    
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
        this.mTomlGenerator = new TomlGenerator(this.mWorkSpacePath);
        this.mQuartus = new Quartus(this.mFileHolder);
    }

    public async UpdateProjectFiles() : Promise<void> {
        await this.mVhdlFinder.GetVhdlFilesFromProject(this.mWorkSpacePath).then((projectFiles) => 
        { 
            this.mFileHolder.SetProjectFiles(projectFiles);
            this.mTomlGenerator.Generate_VHDL_LS(this.mFileHolder);
        });
    }


}