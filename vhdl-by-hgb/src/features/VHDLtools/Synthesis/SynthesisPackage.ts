import { QuartusFactory } from "./Factory/QuartusFactory";
import { ISynthesisFactory } from "./Factory/SynthesisFactory";


export enum eSynthesisTool {
    Diamond = "Diamond",
    Quartus = "Quartus",
    Vivado = "Vivado"
}

export enum eSynthesisProjectFile {
    Diamond = "ldf",
    Quartus = "qsf",
    Vivado = "xpr"
}

// mapping strings of eSynthesisTool-Enum to their factories
export const SynthesisToolMap : Map<string,ISynthesisFactory> = new Map<string,ISynthesisFactory>([
    [eSynthesisTool.Quartus, QuartusFactory.getInstance()],
]);

// mapping strings of eSynthesisProjectFile-Enum to their factories
export const SynthesisProjectFileMap : Map<string,ISynthesisFactory> = new Map<string,ISynthesisFactory>([
    [eSynthesisProjectFile.Quartus, QuartusFactory.getInstance()],
]);