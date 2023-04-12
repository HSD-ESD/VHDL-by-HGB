//specific imports
import { Quartus } from '../../VHDLtools/Synthesis/Quartus';

// general imports
import * as fs from 'fs';
import * as path from 'path';

//------------------------------------------------------------
// module-internal constants
//------------------------------------------------------------

//Commands
const cSetDesignName = "set DesignName ";
const cLoadPackage = "load_package ";
const cProjectNew = "project_new ";
const cProjectOpen = "project_open ";
const cProjectClose = "project_close ";
const cSetGlobalAssignment = "set_global_assignment ";
const cExecuteFlow = "execute_flow ";

//Global Assignments
const cFAMILY = "FAMILY ";
const cDEVICE = "DEVICE ";
const cTOP_LEVEL_ENTITY = "TOP_LEVEL_ENTITY ";
const cVHDL_FILE = "VHDL_FILE ";
const cPROJECT_OUTPUT_DIRECTORY = "PROJECT_OUTPUT_DIRECTORY ";

// Command-Specifiers
const cSpecifierOverwrite = "-overwrite ";
const cSpecifierName = "-name ";
const cFlowCompile = "-compile ";
const cFlowAnalysis = "-analysis_and_elaboration ";

//packages
const cPackageFlow = "flow";
const cPackageProject = "project";

// Variable-References
const cDesignNameReference = "$DesignName";

export class TclGenerator {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mQuartus : Quartus;

    // --------------------------------------------
    // public methods
    // --------------------------------------------
    public constructor(quartus : Quartus) 
    {
        this.mQuartus = quartus;
    }

    //Pass ProjectName as absolute path
    public GenerateQuartusProject() : void {
        
        let wstream : fs.WriteStream = fs.createWriteStream(this.mQuartus.GetProjectPath(), { flags: 'wx' });
        
        //Set DesignName
        wstream.write(cSetDesignName + this.mQuartus.GetProjectName() + "\n\n");

        //Load Packages
        wstream.write(cLoadPackage + cPackageProject + "\n");
        wstream.write(cLoadPackage + cPackageFlow + "\n\n");

        //Create Project
        wstream.write(cProjectNew + cSpecifierOverwrite + cSpecifierName + cDesignNameReference + "\n\n");
        
        //Specify FPGA-Device
        wstream.write(cSetGlobalAssignment + cSpecifierName + cFAMILY + "Cyclone V\n");
        wstream.write(cSetGlobalAssignment + cSpecifierName + cDEVICE + "5CSEMA5F31C6\n\n");

        //Specify Top-Level-Entity
        wstream.write(cSetGlobalAssignment + cSpecifierName + cDesignNameReference + "\n\n");

        path.basename(cTOP_LEVEL_ENTITY);
    }

}