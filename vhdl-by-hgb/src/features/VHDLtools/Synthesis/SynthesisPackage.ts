/* specific imports */
import { QuartusFactory } from "./Factory/QuartusFactory";
import { ISynthesisFactory } from "./Factory/SynthesisFactory";

/* general imports */
import * as path from 'path';

export const ACTIVE_SYNTHESIS_PROJECT = "ActiveSynthesisProject";
export const NO_SYNTHESIS_PROJECT = "None";

export enum eSynthesisTool {
    Quartus = "Quartus",
}

export enum eSynthesisFile {
    Quartus = ".qsf",
}

export const SynthesisGraphicsMap : Map<eSynthesisTool, string> = new Map<eSynthesisTool, string>([
    [eSynthesisTool.Quartus, path.join('resources', 'images','synthesis', 'quartus.svg')],
]);

// mapping strings of eSynthesisTool-Enum to their factories
export const SynthesisToolMap : Map<eSynthesisTool,ISynthesisFactory> = new Map<eSynthesisTool,ISynthesisFactory>([
    [eSynthesisTool.Quartus, QuartusFactory.getInstance()],
]);

// mapping strings of eSynthesisFile to eSynthesisTool-Enum
export const SynthesisFileMap : Map<eSynthesisFile, eSynthesisTool> = new Map<eSynthesisFile, eSynthesisTool>([
    [eSynthesisFile.Quartus, eSynthesisTool.Quartus],
]);