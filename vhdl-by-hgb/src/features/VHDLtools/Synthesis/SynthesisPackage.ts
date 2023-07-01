import { QuartusFactory } from "./Factory/QuartusFactory";
import { ISynthesisFactory } from "./Factory/SynthesisFactory";


export enum eSynthesisTool {
    Diamond = "Diamond",
    Quartus = "Quartus",
    Vivado = "Vivado"
}

export enum eSynthesisFile {
    Diamond = ".tcl",
    Quartus = ".qsf",
    Synopsis = ".sdc",
    Vivado = ".xdc",
}

// mapping strings of eSynthesisTool-Enum to their factories
export const SynthesisToolMap : Map<string,ISynthesisFactory> = new Map<string,ISynthesisFactory>([
[eSynthesisTool.Quartus, QuartusFactory.getInstance()],
]);

// mapping strings of eSynthesisFile to eSynthesisTool-Enum
export const SynthesisFileMap : Map<eSynthesisFile, eSynthesisTool> = new Map<eSynthesisFile, eSynthesisTool>([
[eSynthesisFile.Quartus, eSynthesisTool.Quartus],
]);