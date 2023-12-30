//specific imports
import { IVerificationFactory } from "./verification_factory";
import { ISourceFinder } from "../../../utils/hdl/source_finder/source_finder";

//general imports
import * as vscode from 'vscode';
import { HDLRegressionSourceFinder } from "../../../utils/hdl/source_finder/hdlregression_source_finder";

export class HDLRegressionFactory implements IVerificationFactory
{

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private static mInstance : HDLRegressionFactory;

    private constructor() {}

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public static getInstance(): HDLRegressionFactory
    {
        if (!HDLRegressionFactory.mInstance) {
            HDLRegressionFactory.mInstance = new HDLRegressionFactory();
        }

        return HDLRegressionFactory.mInstance;
    }

    public CreateVhdlFinder(scriptPath : string, outputChannel : vscode.OutputChannel) : ISourceFinder
    {
        return new HDLRegressionSourceFinder(scriptPath, outputChannel);
    }
}