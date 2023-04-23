//Specific Imports
import { ISynthesisProject } from "../SynthesisProject";

//General Imports


export class QuartusProject implements ISynthesisProject
{
    public GenerateProject() : boolean
    {
        return true;
    }

    UpdateFiles() : boolean
    {
        return true;
    }

    LaunchGUI() : void
    {
        
    }

    Compile() : boolean
    {
        return true;
    }
}
