/* specific imports */
import { ISimulationFactory } from "./Factory/SimulationFactory";
import { VUnitFactory } from "./Factory/VUnitFactory";
import { HDLRegressionFactory } from "./Factory/HDLRegressionFactory";

/* general imports */
import * as path from 'path';
import * as vscode from 'vscode';

/* constants */
export const ACTIVE_SIMULATION_PROJECT = "ActiveSimulationProject";
export const NO_SIMULATION_PROJECT = "None";

/* types */
export interface TSimulationProject {
    tool: eSimulationTool;
    file: string;
}

export enum eSimulationTool {
    VUnit = "VUnit",
    HDLRegression = "HDLRegression"
}

// this array allows to activate only certain verification-tools
// and to develop support for other verification-tools without activating them
// for release during development
export const EnabledSimulationTools: eSimulationTool[] = Array.from(new Set([
    eSimulationTool.VUnit,
    eSimulationTool.HDLRegression
]));

/* mappings */
export function getSimulationToolFromScriptPath(scriptPath : string) : eSimulationTool | undefined
{
    const scriptName = path.basename(scriptPath);
    const extensionConfig = vscode.workspace.getConfiguration();

    switch (scriptName)
    {
        case extensionConfig.get("vhdl-by-hgb.vunitScriptName") as string:
            return eSimulationTool.VUnit;
        
        case extensionConfig.get("vhdl-by-hgb.hdlregressionScriptName") as string:
            return eSimulationTool.HDLRegression;

        default:
            return undefined;
    }
}

export function getSimulationToolBaseNameFromTool(tool : eSimulationTool) : string | undefined
{
    const extensionConfig = vscode.workspace.getConfiguration();

    switch (tool)
    {
        case eSimulationTool.VUnit:
            return extensionConfig.get("vhdl-by-hgb.vunitScriptName") as string;

        case eSimulationTool.HDLRegression:
            return extensionConfig.get("vhdl-by-hgb.hdlregressionScriptName") as string;

        default:
            return undefined;
    }
}

// mapping strings of eSimulationTool-Enum to their factories
export const SimulationToolMap : Map<eSimulationTool, ISimulationFactory> = new Map<eSimulationTool, ISimulationFactory>([
    [eSimulationTool.VUnit, VUnitFactory.getInstance()],
    [eSimulationTool.HDLRegression, HDLRegressionFactory.getInstance()],
]);

export const SimulationGraphicsMap : Map<eSimulationTool, string> = new Map<eSimulationTool, string>([
    [eSimulationTool.VUnit, path.join('resources', 'images','simulation', 'vunit.svg')],
    [eSimulationTool.HDLRegression, path.join('resources', 'images','simulation', 'hdlregression.svg')],
]);