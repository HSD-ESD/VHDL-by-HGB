// specific imports

// general imports
import * as  vscode from 'vscode';
import { IVhdlFinder } from '../../../FileTools/VhdlFinder/VhdlFinder';

export interface ISimulationFactory
{
    CreateVhdlFinder(scriptPath : string, outputChannel : vscode.OutputChannel) : IVhdlFinder;
}