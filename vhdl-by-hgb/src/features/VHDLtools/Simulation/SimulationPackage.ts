
export const ACTIVE_SIMULATION_PROJECT = "ActiveVUnitProject";

export interface TSimulationProject {
    tool: eSimulationTool;
    file: string;
}

export enum eSimulationTool {
    VUnit = "VUnit",
    HDLRegression = "HDLRegression"
}
