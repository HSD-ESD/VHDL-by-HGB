import { ISynthesisFactory } from "./Factory/SynthesisFactory";

export class tSynthesisProjectConfig {
    factory!     : ISynthesisFactory;
    name!        : string;
    folderPath!  : string;
};

export interface ISynthesisProject 
{
    UpdateFiles() : boolean;

    LaunchGUI() : void;

    Compile() : boolean;

    SetTopLevelEntity(entity : string) : boolean;

    SetFamily(family : string) : boolean;

    SetDevice(device : string) : boolean;
}

export abstract class SynthesisProject
{
    // --------------------------------------------
    // protected members
    // --------------------------------------------
    protected mName : string;
    protected mPath : string;

    protected constructor(name : string, path : string)
    {
        this.mName = name;
        this.mPath = path;
    }

}