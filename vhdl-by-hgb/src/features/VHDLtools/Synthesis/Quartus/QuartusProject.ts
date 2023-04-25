//Specific Imports
import { ISynthesisProject, SynthesisProject } from "../SynthesisProject";

//General Imports


export class QuartusProject extends SynthesisProject implements ISynthesisProject
{
    // --------------------------------------------
    // private members
    // --------------------------------------------
    

    // --------------------------------------------
    // public methods
    // --------------------------------------------
    public constructor(name : string, path : string)
    {
        super(name, path);
        
    }

    public UpdateFiles() : boolean
    {
        return true;
    }

    public LaunchGUI() : void
    {
        
    }

    public Compile() : boolean
    {
        return true;
    }

    public SetTopLevelEntity(entity : string) : boolean
    {
        return true;
    }

    public SetFamily(family : string) : boolean
    {
        return true;
    }

    public SetDevice(device : string) : boolean
    {
        return true;
    }
}
