
import { VhdlEntity } from "../../VhdlDefinitions";
import { ISynthesisFactory } from "./Factory/SynthesisFactory";
import * as vscode from 'vscode';

export class TSynthesisProjectConfig {
    factory!     : ISynthesisFactory;
    name!        : string;
    folderPath!  : string;
};

export interface ISynthesisProject 
{
    Generate() : Promise<boolean>;
    
    UpdateFiles() : Promise<boolean>;

    LaunchGUI() : Promise<boolean>;

    Compile() : Promise<boolean>;

    SetTopLevel(entity : VhdlEntity) : Promise<boolean>;

    SetFamily(family : string) : Promise<boolean>;

    SetDevice(device : string) : Promise<boolean>;

    GetName() : string;

    GetPath() : string;

    GetTopLevel() : VhdlEntity;

    GetFamily() : string;

    GetDevice() : string;

    GetFiles() : string[];
}

export abstract class SynthesisProject
{
    // --------------------------------------------
    // protected members
    // --------------------------------------------

    //essential members
    protected mName : string;
    protected mFolderPath : string;

    //optional members
    protected mTopLevelEntity! : VhdlEntity;

    // --------------------------------------------
    // protected methods
    // --------------------------------------------
    protected constructor(name : string, path : string)
    {
        this.mName = name;
        this.mFolderPath = path;
    }
        
}