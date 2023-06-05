
export const ACTIVE_SIMULATION_PROJECT = "ActiveSimulationProject";

export interface TSimulationProject {
    tool: eSimulationTool;
    file: string;
}

export enum eSimulationTool {
    VUnit = "VUnit",
    HDLRegression = "HDLRegression"
}
