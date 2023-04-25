/* ------------------------------------------------------------------------------------------
 * GNU General Public License
 * Copyright (c) 2023
 * VHDLbyHGB - VHDL Extension for Visual Studio Code
 * ------------------------------------------------------------------------------------------ */

// General Imports
'use strict';
import * as path from 'path';
import * as vscode from 'vscode';
import { workspace, ExtensionContext} from 'vscode';

//Specific Imports
import { VHDLbyHGB } from './VHDLbyHGB';
import { SynthesisWizard } from './features/VHDLtools/SynthesisWizard';


let VhdlByHgb : VHDLbyHGB;

export async function activate(ctx: ExtensionContext) 
{ 

    let test : SynthesisWizard = new SynthesisWizard();
    test.Run();

    VhdlByHgb = new VHDLbyHGB(ctx);
    VhdlByHgb.Initialize();

}

export function deactivate(): Thenable<void> | undefined 
{
    return VhdlByHgb.Deactivate();
}

