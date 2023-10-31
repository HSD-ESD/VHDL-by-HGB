// general imports
import * as vscode from 'vscode';

// specifc imports
import { VHDL_Library, VHDL_Files, VHDL_ProjectFiles } from "../VHDLtools/VhdlPackage";

export class FileHolder {

    // --------------------------------------------
    // Public members
    // --------------------------------------------
    
    //subscribe to this event for notifications about source-file-changes
    public readonly FilesChanged : vscode.EventEmitter<void>;    

    // --------------------------------------------
    // Private members
    // --------------------------------------------

    // Member for storing all the libraries of a VHDL-Project
    // Key: Library name
    // Value: Array of file paths
    private mProjectFiles : VHDL_ProjectFiles = new Map<VHDL_Library, VHDL_Files>();

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor() 
    {
        this.FilesChanged = new vscode.EventEmitter<void>();
    }

    public SetProjectFiles(projectFiles : VHDL_ProjectFiles) : void
    {
        this.mProjectFiles = projectFiles;
        this.FilesChanged.fire();
    }

    public GetProjectFiles() : VHDL_ProjectFiles 
    { 
        return this.mProjectFiles;
    }

}