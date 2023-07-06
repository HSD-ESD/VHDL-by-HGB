//specific imports
import { ISimulationFactory } from "./SimulationFactory";
import { IVhdlFinder } from "../../../FileTools/VhdlFinder/VhdlFinder";

//general imports
import * as vscode from 'vscode';
import { VUnitVhdlFinder } from "../../../FileTools/VhdlFinder/VUnitVhdlFinder";

export class VUnitFactory implements ISimulationFactory
{

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private static mInstance : VUnitFactory;

    private constructor() {}

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public static getInstance(): VUnitFactory
    {
        if (!VUnitFactory.mInstance) {
            VUnitFactory.mInstance = new VUnitFactory();
        }

        return VUnitFactory.mInstance;
    }

    public CreateVhdlFinder(scriptPath : string, outputChannel : vscode.OutputChannel) : IVhdlFinder
    {
        return new VUnitVhdlFinder(scriptPath, outputChannel);
    }
}