import { SynthesisFactory } from "./SynthesisFactory";
import { ISynthesisProject } from "../SynthesisProject";
import { QuartusProject } from "../Quartus/QuartusProject";

export class QuartusFactory implements SynthesisFactory
{

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private static mInstance : QuartusFactory;

    private constructor() {}

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public static getInstance(): QuartusFactory 
    {
        if (!QuartusFactory.mInstance) {
            QuartusFactory.mInstance = new QuartusFactory();
        }

        return QuartusFactory.mInstance;
    }

    public CreateProject() : ISynthesisProject
    {
        return new QuartusProject();
    }

}