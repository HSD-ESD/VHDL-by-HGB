// specific imports
import { VHDLbyHGB } from "../../vhdl_by_hgb";

// general imports
import * as vscode from 'vscode';

// variables
let VhdlByHgb : VHDLbyHGB;

export async function getExtension() : Promise<VHDLbyHGB | undefined>
{
    if (!VhdlByHgb)
    {
        const extension = vscode.extensions.getExtension('p2l2.vhdl-by-hgb');

        if (!extension)
        {
            return undefined;
        }

        if (!extension.isActive)
        {
            VhdlByHgb = await extension.activate();
        }
        else
        {
            VhdlByHgb = extension.exports;
        }
    }

    return VhdlByHgb;
}