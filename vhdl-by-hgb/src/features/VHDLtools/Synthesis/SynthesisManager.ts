//specific imports
import { SynthesisFactory } from "./Factory/SynthesisFactory";
import { ISynthesisProject } from "./SynthesisProject";

export class SynthesisManager 
{
    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mSynthesisProjects : Array<ISynthesisProject>;
    private mActiveProject! : ISynthesisProject;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    constructor()
    {
        this.mSynthesisProjects = new Array<ISynthesisProject>();
    }

    public AddProject()
    {
        

        // this.mSynthesisProjects.push( );
    }


}