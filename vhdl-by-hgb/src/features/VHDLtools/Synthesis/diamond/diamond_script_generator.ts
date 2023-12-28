// general imports
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// specific imports
import { DiamondProject } from './diamond_project';
import {CustomDiamondTclScript, 
        CustomDiamondTclScriptsFolder,
        DiamondProjectDeviceCommand,
        DiamondProjectImplementationCommand,
        DiamondProjectManipulationCommand as DiamondProjectManipulationCommand, 
        DiamondProjectRunCommand, 
        DiamondProjectSourceCommand} from './diamond_package';

export class DiamondScriptGenerator {

    public static GenerateProject(diamondProject : DiamondProject) : string | undefined 
    {
        if(diamondProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Diamond-Project -> Files cannot be updated!');
            return undefined;
        }

        const scriptPath : string = path.join(diamondProject.GetTclScriptsFolder(), CustomDiamondTclScript.GenerateProject);

        let script : string = "";

        script += `${DiamondProjectManipulationCommand.new} -name \"${diamondProject.GetName()}\" -impl \"${diamondProject.GetName()}\"\n`;

        fs.writeFileSync(scriptPath, script);

        return scriptPath;
    }

    public static GenerateUpdateFiles(diamondProject : DiamondProject) : string | undefined
    {
        if(diamondProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Diamond-Project -> Files cannot be updated!');
            return undefined;
        }

        const scriptPath : string = path.join(diamondProject.GetTclScriptsFolder(), CustomDiamondTclScript.UpdateFiles);

        let script : string = "";

        // open project
        const adjustedProjectPath = diamondProject.GetPath().replace(/\\/g, "/");
        script += `${DiamondProjectManipulationCommand.open} \"${adjustedProjectPath}\"\n\n`;

        //Iterate over all libraries
        for(const file of diamondProject.GetLdf().VhdlFiles)
        {
            //add file to project
            script += `${DiamondProjectSourceCommand.add} \"${path.relative(diamondProject.GetFolderPath(), file).replace(/\\/g, "/")}\"\n`;
        }

        // close project
        script += `${DiamondProjectManipulationCommand.close}\n`;

        fs.writeFileSync(scriptPath, script);

        return scriptPath;
    }

    public static GenerateCompile(diamondProject : DiamondProject) : string | undefined
    {
        if(diamondProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Diamond-Project -> Files cannot be updated!');
            return undefined;
        }

        const scriptPath : string = path.join(diamondProject.GetTclScriptsFolder(), CustomDiamondTclScript.Compile);

        let script : string = "";

        // open project
        const adjustedProjectPath = diamondProject.GetPath().replace(/\\/g, "/");
        script += `${DiamondProjectManipulationCommand.open} \"${adjustedProjectPath}\"\n\n`;
        
        // compile project
        script += `${DiamondProjectRunCommand.run} Synthesis -impl ${diamondProject.GetName()} -forceOne \n`;
        script += `${DiamondProjectRunCommand.run} Translate -impl ${diamondProject.GetName()}\n`;
        script += `${DiamondProjectRunCommand.run} Map -impl ${diamondProject.GetName()}\n`;
        script += `${DiamondProjectRunCommand.run} PAR -impl ${diamondProject.GetName()}\n`;

        // close project
        script += `${DiamondProjectManipulationCommand.close}\n`;

        fs.writeFileSync(scriptPath, script);

        return scriptPath;
    }

    public static GenerateLaunchGUI(diamondProject : DiamondProject) : string | undefined
    {
        if(diamondProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Diamond-Project -> Files cannot be updated!');
            return undefined;
        }

        const scriptPath : string = path.join(diamondProject.GetTclScriptsFolder(), CustomDiamondTclScript.LaunchGUI);

        let script : string = "";

        const adjustedProjectPath = diamondProject.GetPath().replace(/\\/g, "/");
        script += `${DiamondProjectManipulationCommand.open} \"${adjustedProjectPath}\"\n`;

        fs.writeFileSync(scriptPath, script);

        return scriptPath;
    }

    public static GenerateTopLevel(diamondProject : DiamondProject) : string | undefined
    {
        if(diamondProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Diamond-Project -> Files cannot be updated!');
            return undefined;
        }

        const scriptPath : string = path.join(diamondProject.GetTclScriptsFolder(), CustomDiamondTclScript.Family);

        let script : string = "";

        const adjustedProjectPath = diamondProject.GetPath().replace(/\\/g, "/");
        script += `${DiamondProjectManipulationCommand.open} \"${adjustedProjectPath}\"\n`;
        script += `${DiamondProjectImplementationCommand.option} top \"${diamondProject.GetTopLevel()}\"\n`;

        fs.writeFileSync(scriptPath, script);

        return scriptPath;
    }

    public static GenerateDevice(diamondProject : DiamondProject) : string | undefined
    {
        if(diamondProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Diamond-Project -> Files cannot be updated!');
            return undefined;
        }

        const scriptPath : string = path.join(diamondProject.GetTclScriptsFolder(), CustomDiamondTclScript.Device);

        let script : string = "";

        const adjustedProjectPath = diamondProject.GetPath().replace(/\\/g, "/");
        script += `${DiamondProjectManipulationCommand.open} \"${adjustedProjectPath}\"\n`;
        script += `${DiamondProjectDeviceCommand.set} -device ${diamondProject.GetDevice()}\n`;

        fs.writeFileSync(scriptPath, script);

        return scriptPath;
    }

    public static GenerateFamily(diamondProject : DiamondProject) : string | undefined
    {
        if(diamondProject.GetFolderPath().length === 0)
        {
            vscode.window.showInformationMessage('No existing Diamond-Project -> Files cannot be updated!');
            return undefined;
        }

        const scriptPath : string = path.join(diamondProject.GetTclScriptsFolder(), CustomDiamondTclScript.TopLevel);

        let script : string = "";

        const adjustedProjectPath = diamondProject.GetPath().replace(/\\/g, "/");
        script += `${DiamondProjectManipulationCommand.open} \"${adjustedProjectPath}\"\n`;
        script += `${DiamondProjectDeviceCommand.set} -family ${diamondProject.GetFamily()}\n`;

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