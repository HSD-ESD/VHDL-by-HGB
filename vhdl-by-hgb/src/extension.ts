/* ------------------------------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2023
 * VHDLbyHGB - VHDL Extension for Visual Studio Code
 * ------------------------------------------------------------------------------------------ */
'use strict';
import * as path from 'path';
import vscode = require('vscode');
import { workspace, ExtensionContext, window } from 'vscode';

import { VHDLbyHGB } from './VHDLbyHGB';

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


