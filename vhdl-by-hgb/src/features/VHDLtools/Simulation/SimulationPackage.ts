/* specific imports */
import { ISimulationFactory } from "./Factory/SimulationFactory";
import { VUnitFactory } from "./Factory/VUnitFactory";
import { HDLRegressionFactory } from "./Factory/HDLRegressionFactory";

/* general imports */
import * as path from 'path';

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

/* mappings */

// mapping strings of eSimulationTool-Enum to their factories
export const SimulationToolMap : Map<eSimulationTool, ISimulationFactory> = new Map<eSimulationTool, ISimulationFactory>([
    [eSimulationTool.VUnit, VUnitFactory.getInstance()],
    [eSimulationTool.HDLRegression, HDLRegressionFactory.getInstance()],
]);

export const SimulationGraphicsMap : Map<eSimulationTool, string> = new Map<eSimulationTool, string>([
    [eSimulationTool.VUnit, path.join('resources', 'images','simulation', 'vunit.svg')],
    [eSimulationTool.HDLRegression, path.join('resources', 'images','simulation', 'hdlregression.svg')],
]);