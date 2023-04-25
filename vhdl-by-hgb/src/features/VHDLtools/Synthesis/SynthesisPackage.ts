import { QuartusFactory } from "./Factory/QuartusFactory";
import { ISynthesisFactory } from "./Factory/SynthesisFactory";


export enum eSynthesisTool {
    Diamond = "Diamond",
    Quartus = "Quartus",
    Synopsis = "Synopsis",
    Vivado = "Vivado"
}

export const SynthesisToolMap : Map<string,ISynthesisFactory> = new Map<string,ISynthesisFactory>([
[eSynthesisTool.Quartus, QuartusFactory.getInstance()],
]);