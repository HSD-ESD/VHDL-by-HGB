
import { CANCELLED } from "dns";
import { VHDL_Library, VHDL_Files, VHDL_ProjectFiles } from "../../Constants";

export enum VHDL_TOP_LEVEL_ENTITY
{
    Simulation,
    Synthesis
}

export class FileHolder {

    // Member for storing all the libraries of a VHDL-Project
    // Key: Library name
    // Value: Array of file paths
    private mProjectFiles : VHDL_ProjectFiles = new Map<VHDL_Library, VHDL_Files>();

    private mTopLevelEntitySynthesis : string = "";
    private mTopLevelEntitySimulation : string = "";
    
    
    private mIsCompileOrder : boolean = false;

    public SetProjectFiles(projectFiles : VHDL_ProjectFiles) : void
    {
        this.mProjectFiles = projectFiles;
    }

    public GetProjectFiles() : VHDL_ProjectFiles 
    { 
        return this.mProjectFiles;
    }

    public GetTopLevelEntity(entity : VHDL_TOP_LEVEL_ENTITY) : string
    {
        switch(entity)
        {
            case VHDL_TOP_LEVEL_ENTITY.Simulation: return this.mTopLevelEntitySimulation;
            case VHDL_TOP_LEVEL_ENTITY.Synthesis: return this.mTopLevelEntitySynthesis;
        }
    }

}