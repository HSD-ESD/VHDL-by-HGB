import { QuartusFactory } from "./Factory/QuartusFactory";
import { ISynthesisFactory } from "./Factory/SynthesisFactory";


export enum eSynthesisTool {
    Quartus = "Quartus",
}

export enum eSynthesisFile {
    Quartus = ".qsf",
}

// mapping strings of eSynthesisTool-Enum to their factories
export const SynthesisToolMap : Map<eSynthesisTool,ISynthesisFactory> = new Map<eSynthesisTool,ISynthesisFactory>([
[eSynthesisTool.Quartus, QuartusFactory.getInstance()],
]);

// mapping strings of eSynthesisFile to eSynthesisTool-Enum
export const SynthesisFileMap : Map<eSynthesisFile, eSynthesisTool> = new Map<eSynthesisFile, eSynthesisTool>([
[eSynthesisFile.Quartus, eSynthesisTool.Quartus],
]);