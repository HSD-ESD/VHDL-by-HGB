// specific imports
import { ISynthesisProject } from "../SynthesisProject";

// general imports
import * as  vscode from 'vscode';
export interface ISynthesisFactory
{
    CreateProject(name : string, path : string, context : vscode.ExtensionContext) : ISynthesisProject;
}