//specific imports
import { IVerificationFactory } from "./verification_factory";
import { ISourceFinder } from "../../../utils/hdl/source_finder/source_finder";

//general imports
import * as vscode from 'vscode';
import { VUnitSourceFinder } from "../../../utils/hdl/source_finder/vunit_source_finder";

export class VUnitFactory implements IVerificationFactory
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

    public CreateVhdlFinder(scriptPath : string, outputChannel : vscode.OutputChannel) : ISourceFinder
    {
        return new VUnitSourceFinder(scriptPath, outputChannel);
    }
}