// general imports
import * as vscode from 'vscode';

// specifc imports
import { VhdlLibrary, VhdlLibraryContents, VhdlProjectFiles } from "../hdl_tools/vhdl_package";

export class SourceManager {

    // --------------------------------------------
    // Public members
    // --------------------------------------------
    
    //subscribe to this event for notifications about source-file-changes
    public readonly FilesChanged : vscode.EventEmitter<void>;    

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    
    private mProjectFiles : VhdlProjectFiles = new Map<VhdlLibrary, VhdlLibraryContents>();

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor() 
    {
        this.FilesChanged = new vscode.EventEmitter<void>();
    }

    public SetProjectFiles(projectFiles : VhdlProjectFiles) : void
    {
        this.mProjectFiles = projectFiles;
        this.FilesChanged.fire();
    }

    public GetProjectFiles() : VhdlProjectFiles 
    { 
        return this.mProjectFiles;
    }

}