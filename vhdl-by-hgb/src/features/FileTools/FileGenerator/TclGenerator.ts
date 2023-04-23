//specific imports
import { Quartus } from '../../VHDLtools/Synthesis/Quartus/Quartus';
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
const cSetProjectDirectory = "set ProjectDirectory ";
const cSetFileList = "set filelist ";
const cLoadPackage = "load_package ";
const cProjectNew = "project_new ";
const cProjectOpen = "project_open ";
const cProjectClose = "project_close ";
const cSetGlobalAssignment = "set_global_assignment ";
const cExecuteFlow = "execute_flow ";
const cExecute = "exec ";
const cRemoveFile = "remove_file ";

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
const cSpecifierFile = "-file ";

const cSpecifierGlob = "glob ";
const cSpecifierNoComplain = "-nocomplain ";
const cSpecifierDirectory = "-directory ";

//packages
const cPackageFlow = "flow";
const cPackageProject = "project";

// Variable-References
const cDesignNameReference = "$DesignName";
const cProjectDirectoryReference = "$ProjectDirectory ";
const cFileListReference = "$filelist ";
const cFileReference = "$file ";

// WildCards
const cVhdlWildCard = "*.vhd";

//Characters
const cQuote = "\"";

//Sequential Statements
const cForEach = "foreach ";

//Complex Commands
const cRemoveAllFilesFromFileList = cForEach + "file " + cFileListReference + "{" + "\n" 
                                    + "\t" + cRemoveFile + cSpecifierFile + cFileReference + "\n" 
                                    + "}" + "\n\n";


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
        
        //writestream for Tcl-Script
        if(fs.existsSync(path.join(this.mQuartus.GetTclScriptsPath(), TclScripts.GenerateProject)))
        {
            vscode.window.showInformationMessage(TclScripts.GenerateProject + " already exists and cannot be overwritten!");
            return;
        }

        let wstream : fs.WriteStream = fs.createWriteStream(path.join(this.mQuartus.GetTclScriptsPath(), TclScripts.GenerateProject), { flags: 'wx'});
        
        //check writestream
        if(!wstream.writable)
        {
            console.log(Constants.ErrWriteStream);
            return;
        }

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

        //close project
        wstream.write(cProjectClose);

        //close writestream
        wstream.end();

        return;
    }

    public GenerateUpdateFiles() : void
    {
        if(this.mQuartus.GetProjectPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> Files cannot be updated!');
            return;
        }

        let wstream : fs.WriteStream = fs.createWriteStream(path.join(this.mQuartus.GetTclScriptsPath(), TclScripts.UpdateFiles), { flags: 'w' });
        
        //Load Packages
        wstream.write(cLoadPackage + cPackageProject + "\n");
        wstream.write(cLoadPackage + cPackageFlow + "\n\n");

        //Set DesignName
        wstream.write(cSetDesignName + this.mQuartus.GetProjectName() + "\n");
        //Set ProjectDirectory
        wstream.write(cSetProjectDirectory + this.mQuartus.GetProjectPath() + "\n\n");

        //Open Quartus-Project
        wstream.write(cProjectOpen + cDesignNameReference + "\n\n");
        
        //Remove all vhdl-files from qsf
        wstream.write(cSetFileList + "[" + cSpecifierGlob + cSpecifierNoComplain + cSpecifierDirectory + cProjectDirectoryReference + cVhdlWildCard + "]" + "\n\n");
        wstream.write(cRemoveAllFilesFromFileList);

        //Iterate over all libraries
        for(const [lib,files] of this.mQuartus.GetFileHolder().GetProjectFiles().entries())
        {
            //Iterate over all files in a library
            for(let file of files)
            {
                if(!this.mQuartus.IsBlackListed(path.basename(file)))
                {
                    //write path of File
                    wstream.write(cSetGlobalAssignment + cSpecifierName + cVHDL_FILE);
                    wstream.write(path.relative(this.mQuartus.GetProjectPath(), file).replace(/\\/g, "/") + "\n");
                }
            }
        }
        wstream.write("\n");

        wstream.write(cProjectClose);

        //close writestream
        wstream.end();

        return;
    }

    public GenerateCompile() : void
    {
        if(this.mQuartus.GetProjectPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> No compilation posssible!');
            return;
        }

        let wstream : fs.WriteStream = fs.createWriteStream(path.join(this.mQuartus.GetTclScriptsPath(), TclScripts.Compile), { flags: 'w'});

        //Load Packages
        wstream.write(cLoadPackage + cPackageProject + "\n");
        wstream.write(cLoadPackage + cPackageFlow + "\n\n");

        //Open Quartus-Project
        wstream.write(cProjectOpen + path.join(this.mQuartus.GetProjectPath(),this.mQuartus.GetProjectName()).replace(/\\/g, "/") + "\n\n");

        //Compile Project
        wstream.write(cExecuteFlow + cFlowCompile + "\n\n");

        //close project
        wstream.write(cProjectClose);

        //close writestream
        wstream.end();

        return;
    }

    public GenerateLaunchGUI() : void
    {
        if(this.mQuartus.GetProjectPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> Project cannot be opened!');
            return;
        }

        let wstream : fs.WriteStream = fs.createWriteStream(path.join(this.mQuartus.GetTclScriptsPath(), TclScripts.LaunchGUI), { flags: 'w'});

        //Launch Quartus-GUI
        wstream.write(cExecute + (this.mQuartus.GetQuartusExePath().replace(/\\/g, "/")) + " " + path.join(this.mQuartus.GetProjectPath(),this.mQuartus.GetProjectName()).replace(/\\/g, "/"));
    }

}