
import { VhdlEntity } from '../VhdlPackage';
import { ISynthesisFactory } from "./Factory/SynthesisFactory";
import { Quartus } from "./Quartus/Quartus";
import { FileHolder } from "../../FileTools/FileHolder";
import * as vscode from 'vscode';
import { eSynthesisTool } from './SynthesisPackage';


export interface TSynthesisProject {
    tool: eSynthesisTool;
    file: string;
}

export class TSynthesisProjectConfig {
    factory!     : ISynthesisFactory;
    tool!        : eSynthesisTool;
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

    //Getter-Methods
    GetName() : string;

    GetPath() : string;

    GetTopLevel() : VhdlEntity;

    GetDevice() : string;

    GetFamily() : string;

    GetFiles() : string[];

    GetTool() : eSynthesisTool;

}

export abstract class SynthesisProject
{
    // --------------------------------------------
    // protected members
    // --------------------------------------------

    //essential members
    protected mName : string;
    protected mFolderPath : string;

    // --------------------------------------------
    // protected methods
    // --------------------------------------------
    protected constructor(name : string, path : string)
    {
        this.mName = name;
        this.mFolderPath = path;
    }
        
}