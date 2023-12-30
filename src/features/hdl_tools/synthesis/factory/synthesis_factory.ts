// specific imports
import { ISynthesisProject } from "../synthesis_project";

// general imports
import * as  vscode from 'vscode';
export interface ISynthesisFactory
{
    CreateProject(name : string, path : string, context : vscode.ExtensionContext) : ISynthesisProject;
}