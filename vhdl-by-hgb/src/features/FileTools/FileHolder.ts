
import { VHDL_Library, VHDL_Files, VHDL_ProjectFiles } from "../../Constants";

export class FileHolder {

    // Member for storing all the libraries of a VHDL-Project
    // Key: Library name
    // Value: Array of file paths
    private mProjectFiles : VHDL_ProjectFiles = new Map<VHDL_Library, VHDL_Files>();

    private mTopLevelEntity : string = "";
    
    private mIsCompileOrder : boolean = false;

    public SetProjectFiles(projectFiles : VHDL_ProjectFiles) : void
    {
        this.mProjectFiles = projectFiles;
    }

    public GetProjectFiles() : VHDL_ProjectFiles 
    { 
        return this.mProjectFiles;
    }

    public GetTopLevelEntity() : string
    {
        return this.mTopLevelEntity;
    }

}