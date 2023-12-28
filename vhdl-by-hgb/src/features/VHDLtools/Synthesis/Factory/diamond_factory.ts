
// specific members
import { ISynthesisFactory } from "./SynthesisFactory";
import { ISynthesisProject } from "../SynthesisProject";
import { DiamondProject } from "../diamond/diamond_project";

// general members
import * as vscode from 'vscode';

export class DiamondFactory implements ISynthesisFactory
{
    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private static mInstance : DiamondFactory;

    private constructor() {}

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public static getInstance(): DiamondFactory 
    {
        if (!DiamondFactory.mInstance) {
            DiamondFactory.mInstance = new DiamondFactory();
        }

        return DiamondFactory.mInstance;
    }

    public CreateProject(name : string, path : string, context : vscode.ExtensionContext) : ISynthesisProject
    {
        return new DiamondProject(name, path, context);
    }

}