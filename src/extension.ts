/* ------------------------------------------------------------------------------------------
 * GNU General Public License
 * Copyright (c) 2023
 * VHDLbyHGB - VHDL Extension for Visual Studio Code
 * ------------------------------------------------------------------------------------------ */

// general imports
'use strict';
import {ExtensionContext} from 'vscode';

//specific imports
import { VHDLbyHGB } from './vhdl_by_hgb';

let VhdlByHgb : VHDLbyHGB;

export async function activate(ctx: ExtensionContext) 
{ 
    VhdlByHgb = new VHDLbyHGB(ctx);
    VhdlByHgb.Initialize();
}

export function deactivate(): Thenable<void> | undefined 
{
    return VhdlByHgb.Deactivate();
}

