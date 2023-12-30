/* specific imports */
import { IVerificationFactory } from "./factory/verification_factory";
import { VUnitFactory } from "./factory/vunit_factory";
import { HDLRegressionFactory } from "./factory/hdlregression_factory";

/* general imports */
import * as path from 'path';
import * as vscode from 'vscode';

/* constants */
export const ACTIVE_VERIFICATION_PROJECT = "ActiveVerificationProject";
export const NO_VERIFICATION_PROJECT = "None";

/* types */
export interface TVerificationProject {
    tool: eVerificationTool;
    file: string;
}

export enum eVerificationTool {
    VUnit = "VUnit",
    HDLRegression = "HDLRegression"
}

// this array allows to activate only certain verification-tools
// and to develop support for other verification-tools without activating them
// for release during development
export const EnabledVerificationTools: eVerificationTool[] = Array.from(new Set([
    eVerificationTool.VUnit,
    eVerificationTool.HDLRegression
]));

/* mappings */
export function getVerificationToolFromScriptPath(scriptPath : string) : eVerificationTool | undefined
{
    const scriptName = path.basename(scriptPath);
    const extensionConfig = vscode.workspace.getConfiguration();

    switch (scriptName)
    {
        case extensionConfig.get("vhdl-by-hgb.vunitScriptName") as string:
            return eVerificationTool.VUnit;
        
        case extensionConfig.get("vhdl-by-hgb.hdlregressionScriptName") as string:
            return eVerificationTool.HDLRegression;

        default:
            return undefined;
    }
}

export function getVerificationToolBaseNameFromTool(tool : eVerificationTool) : string | undefined
{
    const extensionConfig = vscode.workspace.getConfiguration();

    switch (tool)
    {
        case eVerificationTool.VUnit:
            return extensionConfig.get("vhdl-by-hgb.vunitScriptName") as string;

        case eVerificationTool.HDLRegression:
            return extensionConfig.get("vhdl-by-hgb.hdlregressionScriptName") as string;

        default:
            return undefined;
    }
}

// mapping strings of eVerificationTool-Enum to their factories
export const VerificationToolMap : Map<eVerificationTool, IVerificationFactory> = new Map<eVerificationTool, IVerificationFactory>([
    [eVerificationTool.VUnit, VUnitFactory.getInstance()],
    [eVerificationTool.HDLRegression, HDLRegressionFactory.getInstance()],
]);

export const VerificationGraphicsMap : Map<eVerificationTool, string> = new Map<eVerificationTool, string>([
    [eVerificationTool.VUnit, path.join('resources', 'images','verification', 'vunit.svg')],
    [eVerificationTool.HDLRegression, path.join('resources', 'images','verification', 'hdlregression.svg')],
]);