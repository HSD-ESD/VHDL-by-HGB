
//specific imports
import { IVhdlFinder } from './VhdlFinder';
import { SimpleVhdlFinder } from './SimpleVhdlFinder';
import { VunitVhdlFinder } from './VunitVhdlFinder';
import { ACTIVE_SIMULATION_PROJECT, TSimulationProject, eSimulationTool } from '../../VHDLtools/Simulation/SimulationPackage';

//general imports
import * as vscode from 'vscode';
import * as child_process from 'child_process';


export class VhdlFinderFactory {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mContext : vscode.ExtensionContext;
    private mOutputChannel : vscode.OutputChannel;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(context : vscode.ExtensionContext, outputChannel : vscode.OutputChannel) 
    {
        this.mContext = context;
        this.mOutputChannel = outputChannel;
    }

    public CreateVhdlFinder() : IVhdlFinder
    {
        //default Finder
        let vhdlFinder : IVhdlFinder = new SimpleVhdlFinder();

        if(!this.IsPythonInstalled())
        {
            vscode.window.showInformationMessage("Install python for advanced library-mapping");
        }
        else
        {
            const activeSimulationProject : TSimulationProject | undefined = this.mContext.workspaceState.get(ACTIVE_SIMULATION_PROJECT);

            if (activeSimulationProject)
            {
                if(activeSimulationProject.tool === eSimulationTool.VUnit)
                {
                    if(!this.IsVUnitHdlInstalled())
                    {
                        if(this.InstallVUnitHdl())
                        {
                            vscode.window.showInformationMessage("VUnit was installed successfully!");
                        }
                    }
                    
                    vhdlFinder = new VunitVhdlFinder(activeSimulationProject.file);
                }
            }      
        }

        return vhdlFinder;
    }

    private IsPythonInstalled(): boolean
    {
        //result.error === null && 
        const result = child_process.spawnSync('python', ['--version']);
        if (result.status === 0) {
            const output = result.stdout.toString().trim();
            this.mOutputChannel.appendLine(`Python version: ${output}`);
            return true;
        } else {
            this.mOutputChannel.appendLine('Python is not installed.');
            return false;
        }
    }

    private IsVUnitHdlInstalled(): boolean {
        const result = child_process.spawnSync('pip', ['show', 'vunit_hdl']);
        if (result.status === 0) {
            const output = result.stdout.toString().trim();
            const infoLines = output.split('\n');
            this.mOutputChannel.appendLine(`VUnit-${infoLines[1]}`);
            return true;
        }
        else
        {
            this.mOutputChannel.appendLine('VUnit is not installed');
            return false;
        }
    }

    private InstallVUnitHdl(IsUpdate: boolean = false): boolean {
        const command = IsUpdate ? ['install', '-U', 'vunit_hdl'] : ['install', 'vunit_hdl'];
        const result = child_process.spawnSync('pip', command);
        if (result.error === null && result.status === 0) {
            this.mOutputChannel.appendLine('VUnit was updated');
            return true;
        } else {
            this.mOutputChannel.appendLine('Failed to install VUnit!');
            return false;
        }
    }

}