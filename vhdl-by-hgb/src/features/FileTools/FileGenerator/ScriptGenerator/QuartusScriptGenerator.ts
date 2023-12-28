//specific imports
import { QuartusProject } from '../../../VHDLtools/Synthesis/Quartus/QuartusProject';
import  {CustomQuartusTclScript, CustomQuartusTclScriptsFolder} from "../../../VHDLtools/Synthesis/Quartus/QuartusPackage";
import * as Constants from '../../../vhdl_ls_package';

// general imports
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

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


export class QuartusScriptGenerator {

    // --------------------------------------------
    // Private members
    // --------------------------------------------

    // --------------------------------------------
    // public methods
    // --------------------------------------------

    //Pass ProjectName as absolute path
    public static GenerateProject(quartusProject : QuartusProject) : string | undefined {
        
        if(quartusProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> Files cannot be updated!');
            return undefined;
        }

        const scriptPath : string = path.join(quartusProject.GetTclScriptsFolder(), CustomQuartusTclScript.GenerateProject);
        let wstream : fs.WriteStream = fs.createWriteStream(scriptPath, { flags: 'wx'});
        
        //check writestream
        if(!wstream.writable)
        {
            console.log("Error in writestream");
            return undefined;
        }

        //Set DesignName
        wstream.write(cSetDesignName + quartusProject.GetName() + "\n\n");

        //Load Packages
        wstream.write(cLoadPackage + cPackageProject + "\n");
        wstream.write(cLoadPackage + cPackageFlow + "\n\n");

        //Create Project
        wstream.write(cProjectNew + cDesignNameReference + "\n\n");    

        //Specify Top-Level-Entity
            //wstream.write(cSetGlobalAssignment + cSpecifierName + cTOP_LEVEL_ENTITY + quartusProject.GetFileHolder().GetTopLevelEntity(VHDL_TOP_LEVEL_ENTITY.Synthesis) + "\n\n");

        //Specify Output-Directory
        wstream.write(cSetGlobalAssignment + cSpecifierName + cPROJECT_OUTPUT_DIRECTORY + "output_files" + "\n\n");

        //close project
        wstream.write(cProjectClose);

        //close writestream
        wstream.end();

        return scriptPath;
    }

    public static GenerateUpdateFiles(quartusProject : QuartusProject) : string | undefined
    {
        if(quartusProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> Files cannot be updated!');
            return undefined;
        }

        const scriptPath : string = path.join(quartusProject.GetTclScriptsFolder(), CustomQuartusTclScript.UpdateFiles);
        let wstream : fs.WriteStream = fs.createWriteStream(scriptPath, { flags: 'w' });
        
        //Load Packages
        wstream.write(cLoadPackage + cPackageProject + "\n");
        wstream.write(cLoadPackage + cPackageFlow + "\n\n");

        //Set DesignName
        wstream.write(cSetDesignName + quartusProject.GetName() + "\n");
        //Set ProjectDirectory
        wstream.write(cSetProjectDirectory + quartusProject.GetFolderPath() + "\n\n");

        //Open Quartus-Project
        wstream.write(cProjectOpen + cDesignNameReference + "\n\n");
        
        //Remove all vhdl-files from qsf
        wstream.write(cSetFileList + "[" + cSpecifierGlob + cSpecifierNoComplain + cSpecifierDirectory + cProjectDirectoryReference + cVhdlWildCard + "]" + "\n\n");
        wstream.write(cRemoveAllFilesFromFileList);

        //Iterate over all libraries
        for(const file of quartusProject.GetQsf().VhdlFiles)
        {
            //write path of File
            wstream.write(cSetGlobalAssignment + cSpecifierName + cVHDL_FILE);
            wstream.write(path.relative(quartusProject.GetFolderPath(), file).replace(/\\/g, "/") + "\n");
        }
        wstream.write("\n");

        wstream.write(cProjectClose);

        //close writestream
        wstream.end();

        return scriptPath;
    }

    public static GenerateCompile(quartusProject : QuartusProject) : string | undefined
    {
        if(quartusProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> No compilation posssible!');
            return undefined;
        }

        const scriptPath : string = path.join(quartusProject.GetTclScriptsFolder(), CustomQuartusTclScript.Compile);
        let wstream : fs.WriteStream = fs.createWriteStream(scriptPath, { flags: 'w'});

        //Load Packages
        wstream.write(cLoadPackage + cPackageProject + "\n");
        wstream.write(cLoadPackage + cPackageFlow + "\n\n");

        //Open Quartus-Project
        wstream.write(cProjectOpen + path.join(quartusProject.GetFolderPath(), quartusProject.GetName()).replace(/\\/g, "/") + "\n\n");

        //Compile Project
        wstream.write(cExecuteFlow + cFlowCompile + "\n\n");

        //close project
        wstream.write(cProjectClose);

        //close writestream
        wstream.end();

        return scriptPath;
    }

    public static GenerateLaunchGUI(quartusProject : QuartusProject) : string | undefined
    {
        if(quartusProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> GUI cannot be launched!');
            return undefined;
        }

        const scriptPath : string = path.join(quartusProject.GetTclScriptsFolder(), CustomQuartusTclScript.LaunchGUI);
        let wstream : fs.WriteStream = fs.createWriteStream(scriptPath, { flags: 'w'});

        //Launch Quartus-GUI
        wstream.write(cExecute + (quartusProject.GetQuartus().GetExePath().replace(/\\/g, "/")) + " " + path.join(quartusProject.GetFolderPath(), quartusProject.GetName()).replace(/\\/g, "/"));

        return scriptPath;
    }

    public static GenerateTopLevelEntity(quartusProject : QuartusProject) : string | undefined
    {
        if(quartusProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> TopLevelEntity cannot be set!');
            return undefined;
        }

        //check, if top-level-entity has already been set
        if(!quartusProject.GetTopLevel())
        {
            vscode.window.showWarningMessage('Top-Level-Entity has not been set yet!');
            return undefined;
        }

        const scriptPath : string = path.join(quartusProject.GetTclScriptsFolder(), CustomQuartusTclScript.TopLevelEntity);
        let wstream : fs.WriteStream = fs.createWriteStream(scriptPath, { flags: 'w'});

        //Load Packages
        wstream.write(cLoadPackage + cPackageProject + "\n");
        wstream.write(cLoadPackage + cPackageFlow + "\n\n");

        //Open Quartus-Project
        wstream.write(cProjectOpen + path.join(quartusProject.GetFolderPath(), quartusProject.GetName()).replace(/\\/g, "/") + "\n\n");

        //Set Top-Level-Entity
        wstream.write(cSetGlobalAssignment + cSpecifierName + cTOP_LEVEL_ENTITY + quartusProject.GetTopLevel().mName + "\n");
        
        //close project
        wstream.write(cProjectClose);

        //close writestream
        wstream.end();

        return scriptPath;
    }

    public static GenerateDevice(quartusProject : QuartusProject) : string | undefined
    {
        if(quartusProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> Device cannot be set!');
            return undefined;
        }

        //check, if device has already been set
        if(!quartusProject.GetDevice())
        {
            vscode.window.showWarningMessage('Device has not been set yet!');
            return undefined;
        }

        const scriptPath : string = path.join(quartusProject.GetTclScriptsFolder(), CustomQuartusTclScript.Device);
        let wstream : fs.WriteStream = fs.createWriteStream(scriptPath, { flags: 'w'});

        //Load Packages
        wstream.write(cLoadPackage + cPackageProject + "\n");
        wstream.write(cLoadPackage + cPackageFlow + "\n\n");

        //Open Quartus-Project
        wstream.write(cProjectOpen + path.join(quartusProject.GetFolderPath(), quartusProject.GetName()).replace(/\\/g, "/") + "\n\n");

        //Set Device
        wstream.write(cSetGlobalAssignment + cSpecifierName + cDEVICE + quartusProject.GetDevice() + "\n\n");

        //close project
        wstream.write(cProjectClose);

        //close writestream
        wstream.end();

        return scriptPath;
    }

    public static GenerateFamily(quartusProject : QuartusProject) : string | undefined
    {
        if(quartusProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> Family cannot be set!');
            return undefined;
        }

        //check, if device has already been set
        if(!quartusProject.GetFamily())
        {
            vscode.window.showWarningMessage('Family has not been set yet!');
            return undefined;
        }

        const scriptPath : string = path.join(quartusProject.GetTclScriptsFolder(), CustomQuartusTclScript.Family);
        let wstream : fs.WriteStream = fs.createWriteStream(scriptPath, { flags: 'w'});

        //Load Packages
        wstream.write(cLoadPackage + cPackageProject + "\n");
        wstream.write(cLoadPackage + cPackageFlow + "\n\n");

        //Open Quartus-Project
        wstream.write(cProjectOpen + path.join(quartusProject.GetFolderPath(), quartusProject.GetName()).replace(/\\/g, "/") + "\n\n");

        //Set Device
        wstream.write(cSetGlobalAssignment + cSpecifierName + cFAMILY + cQuote + quartusProject.GetFamily() + cQuote + "\n\n");

        //close project
        wstream.write(cProjectClose);

        //close writestream
        wstream.end();

        return scriptPath;
    }

    public static DeleteScript(scriptPath : string) : void
    {
        if(fs.existsSync(scriptPath))
        {
            fs.unlinkSync(scriptPath);
        }
    }

}