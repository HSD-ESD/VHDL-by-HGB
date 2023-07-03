
//specific imports
import { IVhdlFinder } from './VhdlFinder';
import { SimpleVhdlFinder } from './SimpleVhdlFinder';
import { ACTIVE_SIMULATION_PROJECT, TSimulationProject, eSimulationTool } from '../../VHDLtools/Simulation/SimulationPackage';
import { VUnitVhdlFinder } from './VUnitVhdlFinder';

//general imports
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';


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

        const activeSimulationProject : TSimulationProject | undefined = this.mContext.workspaceState.get(ACTIVE_SIMULATION_PROJECT);

        if (activeSimulationProject)
        {
            if(fs.existsSync(activeSimulationProject.file))
            {
                if(activeSimulationProject.tool === eSimulationTool.VUnit)
                {            
                    vhdlFinder = new VUnitVhdlFinder(activeSimulationProject.file);
                }
            }
        }      

        return vhdlFinder;
    }

}