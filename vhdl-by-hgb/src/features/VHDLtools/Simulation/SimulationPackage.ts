// specific imports
import { ISimulationFactory } from "./Factory/SimulationFactory";
import { VUnitFactory } from "./Factory/VUnitFactory";
import { HDLRegressionFactory } from "./Factory/HDLRegressionFactory";

//general imports
import * as path from 'path';

export const ACTIVE_SIMULATION_PROJECT = "ActiveSimulationProject";
export const NO_SIMULATION_PROJECT = "None";

export interface TSimulationProject {
    tool: eSimulationTool;
    file: string;
}

export enum eSimulationTool {
    VUnit = "VUnit",
    HDLRegression = "HDLRegression"
}

// mapping strings of eSimulationTool-Enum to their factories
export const SimulationToolMap : Map<eSimulationTool, ISimulationFactory> = new Map<eSimulationTool, ISimulationFactory>([
    [eSimulationTool.VUnit, VUnitFactory.getInstance()],
    [eSimulationTool.HDLRegression, HDLRegressionFactory.getInstance()],
]);

export const SimulationGraphicsMap : Map<eSimulationTool, string> = new Map<eSimulationTool, string>([
    [eSimulationTool.VUnit, path.join(__filename,  '..', '..', '..', '..', '..', 'resources', 'images','simulation', 'vunit.svg')],
    [eSimulationTool.HDLRegression, path.join(__filename,  '..', '..', '..', '..', '..', 'resources', 'images','simulation', 'hdlregression.svg')],
]);