import { ISynthesisFactory } from "./SynthesisFactory";
import { ISynthesisProject } from "../SynthesisProject";
import { QuartusProject } from "../Quartus/QuartusProject";

export class QuartusFactory implements ISynthesisFactory
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

    public CreateProject(name : string, path : string) : ISynthesisProject
    {
        return new QuartusProject(name, path);
    }

}