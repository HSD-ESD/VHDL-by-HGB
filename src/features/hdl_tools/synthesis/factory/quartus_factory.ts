// specific members
import { ISynthesisFactory } from "./synthesis_factory";
import { ISynthesisProject } from "../synthesis_project";
import { QuartusProject } from "../quartus/quartus_project";

// general members
import * as vscode from 'vscode';

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

    public CreateProject(name : string, path : string, context : vscode.ExtensionContext) : ISynthesisProject
    {
        return new QuartusProject(name, path, context);
    }

}