
//import { VhdlParser } from "../../FileTools/VhdlParser/VhdlParser";
import { VhdlParser } from "../../FileTools/VhdlParser/VhdlParser";
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

    SetTopLevelEntity(entity : VhdlEntity) : Promise<boolean>;

    SetFamily(family : string) : Promise<boolean>;

    SetDevice(device : string) : Promise<boolean>;
}

export abstract class SynthesisProject
{
    // --------------------------------------------
    // protected members
    // --------------------------------------------

    //essential members
    protected mName : string;
    protected mPath : string;

    //optional members
    protected mTopLevelEntity! : VhdlEntity;
    protected mFamily! : string;
    protected mDevice! : string;

    //vscode-members
    protected mOutputChannel : vscode.OutputChannel;
    protected mContext : vscode.ExtensionContext;

    // --------------------------------------------
    // protected methods
    // --------------------------------------------
    protected constructor(name : string, path : string, outputChannel : vscode.OutputChannel, context : vscode.ExtensionContext)
    {
        this.mName = name;
        this.mPath = path;

        this.mOutputChannel = outputChannel;
        this.mContext = context;
    }
        
}