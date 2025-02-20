//specific imports
import { QuartusProject } from './quartus_project';
import  {CustomQuartusTclScript, CustomQuartusTclScriptsFolder} from "./quartus_package";

// general imports
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Quartus } from './quartus';

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
    public static GenerateProject(quartusProject : QuartusProject) : string | undefined {
        
        if(quartusProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Quartus-Project -> Files cannot be updated!');
            return undefined;
        }

        const scriptPath : string = path.join(quartusProject.GetTclScriptsFolder(), CustomQuartusTclScript.GenerateProject);
        let script : string = "";
    
        //Set DesignName
        script += cSetDesignName + quartusProject.GetName() + "\n\n";
        
        //Load Packages
        script += cLoadPackage + cPackageProject + "\n";
        script += cLoadPackage + cPackageFlow + "\n\n";

        //Create Project
        script += cProjectNew + cDesignNameReference + "\n\n";

        //Specify Output-Directory
        script += cSetGlobalAssignment + cSpecifierName + cPROJECT_OUTPUT_DIRECTORY + "output_files" + "\n\n";

        //close project
        script += cProjectClose;

        fs.writeFileSync(scriptPath, script);

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
        let script : string = "";

        //Load Packages
        script += cLoadPackage + cPackageProject + "\n";
        script += cLoadPackage + cPackageFlow + "\n\n";

        //Set DesignName
        script += cSetDesignName + quartusProject.GetName() + "\n";
        //Set ProjectDirectory
        script += cSetProjectDirectory + cQuote + quartusProject.GetFolderPath() + cQuote + "\n\n";

        //Open Quartus-Project
        script += cProjectOpen + cDesignNameReference + "\n\n";

        //Remove all vhdl-files from qsf
        script += cSetFileList + "[" + cSpecifierGlob + cSpecifierNoComplain + cSpecifierDirectory + cProjectDirectoryReference + cVhdlWildCard + "]" + "\n\n";
        script += cRemoveAllFilesFromFileList;

        //Iterate over all libraries
        for(const file of quartusProject.GetQsf().VhdlFiles)
        {
            //write path of File
            script += cSetGlobalAssignment + cSpecifierName + cVHDL_FILE;
            script += cQuote + path.relative(quartusProject.GetFolderPath(), file).replace(/\\/g, "/") + cQuote + "\n";
        }
        script += "\n";

        script += cProjectClose;

        fs.writeFileSync(scriptPath, script);

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
        let script : string = "";

        //Load Packages
        script += cLoadPackage + cPackageProject + "\n";
        script += cLoadPackage + cPackageFlow + "\n\n";

        //Open Quartus-Project
        script += cProjectOpen + cQuote + path.join(quartusProject.GetFolderPath(), quartusProject.GetName()).replace(/\\/g, "/") + cQuote + "\n\n";

        //Compile Project
        script += cExecuteFlow + cFlowCompile + "\n\n";

        //close project
        script += cProjectClose;

        fs.writeFileSync(scriptPath, script);

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
        let script : string = "";

        const exePath = Quartus.GetExePath();

        if(!exePath)
        {
            vscode.window.showInformationMessage('No Quartus-Installation found -> GUI cannot be launched!');
            return undefined;
        }

        //Launch Quartus-GUI
        script += cExecute + cQuote + (exePath.replace(/\\/g, "/")) + cQuote + cQuote + path.join(quartusProject.GetFolderPath(), quartusProject.GetName()).replace(/\\/g, "/") + cQuote;

        fs.writeFileSync(scriptPath, script);

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
        let script : string = "";

        //Load Packages
        script += cLoadPackage + cPackageProject + "\n";
        script += cLoadPackage + cPackageFlow + "\n\n";

        //Open Quartus-Project
        script += cProjectOpen + cQuote + path.join(quartusProject.GetFolderPath(), quartusProject.GetName()).replace(/\\/g, "/") + cQuote + "\n\n";

        //Set Top-Level-Entity
        script += cSetGlobalAssignment + cSpecifierName + cTOP_LEVEL_ENTITY + quartusProject.GetTopLevel().mName + "\n";

        //close project
        script += cProjectClose;

        fs.writeFileSync(scriptPath, script);

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
        let script : string = "";

        //Load Packages
        script += cLoadPackage + cPackageProject + "\n";
        script += cLoadPackage + cPackageFlow + "\n\n";

        //Open Quartus-Project
        script += cProjectOpen + path.join(quartusProject.GetFolderPath(), quartusProject.GetName()).replace(/\\/g, "/") + "\n\n";

        //Set Device
        script += cSetGlobalAssignment + cSpecifierName + cDEVICE + quartusProject.GetDevice() + "\n\n";

        //close project
        script += cProjectClose;

        fs.writeFileSync(scriptPath, script);

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
        let script : string = "";

        //Load Packages
        script += cLoadPackage + cPackageProject + "\n";
        script += cLoadPackage + cPackageFlow + "\n\n";

        //Open Quartus-Project
        script += cProjectOpen + path.join(quartusProject.GetFolderPath(), quartusProject.GetName()).replace(/\\/g, "/") + "\n\n";

        //Set Device
        script += cSetGlobalAssignment + cSpecifierName + cFAMILY + cQuote + quartusProject.GetFamily() + cQuote + "\n\n";

        //close project
        script += cProjectClose;

        fs.writeFileSync(scriptPath, script);

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