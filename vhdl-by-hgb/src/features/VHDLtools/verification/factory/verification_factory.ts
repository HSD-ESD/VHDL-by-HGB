// specific imports

// general imports
import * as  vscode from 'vscode';
import { IVhdlFinder } from '../../../FileTools/VhdlFinder/VhdlFinder';

export interface IVerificationFactory
{
    CreateVhdlFinder(scriptPath : string, outputChannel : vscode.OutputChannel) : IVhdlFinder;
}