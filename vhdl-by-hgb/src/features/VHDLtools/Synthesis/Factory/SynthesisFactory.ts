// specific imports
import { ISynthesisProject } from "../SynthesisProject";
import { FileHolder } from "../../../FileTools/FileHolder";

// general imports
import * as  vscode from 'vscode';
export interface ISynthesisFactory
{
    CreateProject(name : string, path : string, context : vscode.ExtensionContext) : ISynthesisProject;
}