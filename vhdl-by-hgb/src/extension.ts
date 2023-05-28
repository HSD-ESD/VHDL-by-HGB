/* ------------------------------------------------------------------------------------------
 * GNU General Public License
 * Copyright (c) 2023
 * VHDLbyHGB - VHDL Extension for Visual Studio Code
 * ------------------------------------------------------------------------------------------ */

// General Imports
'use strict';
import * as path from 'path';
import * as vscode from 'vscode';
import { workspace, ExtensionContext } from 'vscode';

//Specific Imports
import { VHDLbyHGB } from './VHDLbyHGB';
import { SynthesisWizard } from './features/VHDLtools/Synthesis/SynthesisWizard';
import { LsOutput } from './features/VhdlLsOutput';

let VhdlByHgb: VHDLbyHGB;

let SnippetsChange: LsOutput;

export async function activate(ctx: ExtensionContext) {
    VhdlByHgb = new VHDLbyHGB(ctx);
    await VhdlByHgb.Initialize();

    /*SnippetsChange = new LsOutput(ctx);
    if (vscode.workspace.workspaceFolders !== undefined) {
        const filepath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        await SnippetsChange.ChangeSnippets();
    }*/
}

export function deactivate(): Thenable<void> | undefined {
    return VhdlByHgb.Deactivate();
}

