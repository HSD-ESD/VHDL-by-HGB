/* specific imports */
import { QuartusFactory } from "./Factory/QuartusFactory";
import { DiamondFactory } from "./Factory/diamond_factory";
import { ISynthesisFactory } from "./Factory/SynthesisFactory";

/* general imports */
import * as path from 'path';

export const ACTIVE_SYNTHESIS_PROJECT = "ActiveSynthesisProject";
export const NO_SYNTHESIS_PROJECT = "None";

export enum eSynthesisTool {
    Quartus = "Quartus",    // Intel
    Diamond = "Diamond",    // Lattice
}

export enum eSynthesisFile {
    Quartus = ".qsf",
    Diamond = ".ldf",
}

// this array allows to activate only certain synthesis tools
// and to develop support for other synthesis-tools without activating them
// for release during development
export const EnabledSynthesisTools: eSynthesisTool[] = Array.from(new Set([
    eSynthesisTool.Quartus
]));

export const SynthesisGraphicsMap: Map<eSynthesisTool, string> = new Map<eSynthesisTool, string>([
    [eSynthesisTool.Quartus, path.join('resources', 'images','synthesis', 'quartus.svg')],
    [eSynthesisTool.Diamond, path.join('resources', 'images','synthesis', 'diamond.svg')],
]);

// mapping strings of eSynthesisTool-Enum to their factories
export const SynthesisToolMap: Map<eSynthesisTool, ISynthesisFactory> = new Map<eSynthesisTool, ISynthesisFactory>([
    [eSynthesisTool.Quartus, QuartusFactory.getInstance()],
    [eSynthesisTool.Diamond, DiamondFactory.getInstance()],
]);

// mapping strings of eSynthesisFile to eSynthesisTool-Enum
export const SynthesisFileMap: Map<eSynthesisFile, eSynthesisTool> = new Map<eSynthesisFile, eSynthesisTool>([
    [eSynthesisFile.Quartus, eSynthesisTool.Quartus],
    [eSynthesisFile.Diamond, eSynthesisTool.Diamond],
]);