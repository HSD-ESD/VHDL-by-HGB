//specific imports
import { Quartus } from '../../VHDLtools/Synthesis/Quartus';
import * as TclScripts from './../../VHDLtools/Synthesis/TclScripts';
import * as Constants from './../../../Constants';

// general imports
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { VHDL_TOP_LEVEL_ENTITY } from '../FileHolder';

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

//Characters
const cQuote = "\"";

export class TclGenerator {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mQuartus : Quartus;
    private mTclScriptsFolder : string = "";

    // --------------------------------------------
    // public methods
    // --------------------------------------------
    public constructor(quartus : Quartus) 
    {
        this.mQuartus = quartus;
    }

    //Pass ProjectName as absolute path
    public GenerateQuartusProject() : void {

        //When new Quartus-Project is created -> make directory for all Tcl-Scripts
        this.mTclScriptsFolder = path.join(this.mQuartus.GetProjectPath(), TclScripts.Folder);
        if (!fs.existsSync(this.mTclScriptsFolder)) {
            fs.mkdirSync(this.mTclScriptsFolder);
        }
        
        //writestream for Tcl-Script
        let wstream : fs.WriteStream = fs.createWriteStream(path.join(this.mTclScriptsFolder, TclScripts.GenerateProject), { flags: 'wx' });
        
        //Set DesignName
        wstream.write(cSetDesignName + this.mQuartus.GetProjectName() + "\n\n");

        //Load Packages
        wstream.write(cLoadPackage + cPackageProject + "\n");
        wstream.write(cLoadPackage + cPackageFlow + "\n\n");

        //Create Project
        wstream.write(cProjectNew + cDesignNameReference + "\n\n");
        
        //Specify FPGA-Device
        wstream.write(cSetGlobalAssignment + cSpecifierName + cFAMILY + cQuote + "Cyclone V" + cQuote + "\n");
        wstream.write(cSetGlobalAssignment + cSpecifierName + cDEVICE + "5CSEMA5F31C6" + "\n\n");

        //Specify Top-Level-Entity
        wstream.write(cSetGlobalAssignment + cSpecifierName + cTOP_LEVEL_ENTITY + this.mQuartus.GetFileHolder().GetTopLevelEntity(VHDL_TOP_LEVEL_ENTITY.Synthesis) + "\n\n");

        //Specify Output-Directory
        wstream.write(cSetGlobalAssignment + cSpecifierName + cPROJECT_OUTPUT_DIRECTORY + "output_files" + "\n\n");

        path.basename(cTOP_LEVEL_ENTITY);

        wstream.write(cProjectClose);
    }

    public GenerateUpdateFiles() : void
    {
        if(this.mQuartus.GetProjectPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> Files cannot be updated!');
            return;
        }

        let wstream : fs.WriteStream = fs.createWriteStream(path.join(this.mTclScriptsFolder, TclScripts.UpdateFiles), { flags: 'wx' });
        
        //Set DesignName
        wstream.write(cSetDesignName + this.mQuartus.GetProjectName() + "\n\n");

        //Open Quartus-Project
        wstream.write(cProjectOpen + cDesignNameReference + "\n\n");

        //Iterate over all libraries
        for(const [lib,files] of this.mQuartus.GetFileHolder().GetProjectFiles().entries())
        {
            //Iterate over all files in a library
            for(let file of files)
            {
                //write path of File
                wstream.write(cSetGlobalAssignment + cSpecifierName + cVHDL_FILE);
                wstream.write(path.relative(this.mQuartus.GetProjectPath(), file).replace(/\\/g, "/") + "\n");
            }
        }
        wstream.write("\n");

        wstream.write(cProjectClose);
    }



}