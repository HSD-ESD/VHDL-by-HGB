/* ------------------------------------------------------------------------------------------
 * GNU General Public License
 * Copyright (c) 2023
 * VHDLbyHGB - VHDL Extension for Visual Studio Code
 * ------------------------------------------------------------------------------------------ */

// General Imports
'use strict';
import { workspace, ExtensionContext} from 'vscode';

//Specific Imports
import { VHDLbyHGB } from './VHDLbyHGB';

export async function activate(ctx: ExtensionContext) {
    VhdlByHgb = new VHDLbyHGB(ctx);
    await VhdlByHgb.Initialize();
}

export function deactivate(): Thenable<void> | undefined {
    return VhdlByHgb.Deactivate();
}

