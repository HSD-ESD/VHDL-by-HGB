/* ------------------------------------------------------------------------------------------
 * GNU General Public License
 * Copyright (c) 2023
 * VHDLbyHGB - VHDL Extension for Visual Studio Code
 * ------------------------------------------------------------------------------------------ */

'use strict';

// general imports
import {ExtensionContext} from 'vscode';

//specific imports
import { VHDLbyHGB } from './vhdl_by_hgb';

let VhdlByHgb : VHDLbyHGB;

export async function activate(ctx: ExtensionContext) : Promise<VHDLbyHGB>
{ 
    VhdlByHgb = new VHDLbyHGB(ctx);
    VhdlByHgb.Initialize();
    return VhdlByHgb;
}

export function deactivate(): Thenable<void> | undefined 
{
    return VhdlByHgb.Deactivate();
}
