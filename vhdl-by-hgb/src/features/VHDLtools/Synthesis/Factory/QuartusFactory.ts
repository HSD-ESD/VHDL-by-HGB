// specific members
import { ISynthesisFactory } from "./SynthesisFactory";
import { ISynthesisProject } from "../SynthesisProject";
import { QuartusProject } from "../Quartus/QuartusProject";

// general members
import * as vscode from 'vscode';
import { FileHolder } from "../../../FileTools/FileHolder";

export class QuartusFactory implements ISynthesisFactory
{

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private static mInstance : QuartusFactory;

    private constructor() {}

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public static getInstance(): QuartusFactory 
    {
        if (!QuartusFactory.mInstance) {
            QuartusFactory.mInstance = new QuartusFactory();
        }

        return QuartusFactory.mInstance;
    }

    public CreateProject(name : string, path : string, outputChannel : vscode.OutputChannel, context : vscode.ExtensionContext, fileHolder : FileHolder) : ISynthesisProject
    {
        return new QuartusProject(name, path, outputChannel, context, fileHolder);
    }

}