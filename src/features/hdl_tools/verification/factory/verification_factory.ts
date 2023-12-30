// specific imports

// general imports
import * as  vscode from 'vscode';
import { ISourceFinder } from '../../../utils/hdl/source_finder/source_finder';

export interface IVerificationFactory
{
    CreateVhdlFinder(scriptPath : string, outputChannel : vscode.OutputChannel) : ISourceFinder;
}