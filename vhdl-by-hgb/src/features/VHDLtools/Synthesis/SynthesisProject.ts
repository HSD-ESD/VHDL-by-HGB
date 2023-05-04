import { ISynthesisFactory } from "./Factory/SynthesisFactory";
import * as vscode from 'vscode';

export class tSynthesisProjectConfig {
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

    SetTopLevelEntity(entity : string) : Promise<boolean>;

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
    protected mTopLevelEntity! : string;
    protected mFamily! : string;
    protected mDevice! : string;

    //vscode-members
    protected mOutputChannel : vscode.OutputChannel;
    protected mContext : vscode.ExtensionContext;

    protected constructor(name : string, path : string, outputChannel : vscode.OutputChannel, context : vscode.ExtensionContext)
    {
        this.mName = name;
        this.mPath = path;

        this.mOutputChannel = outputChannel;
        this.mContext = context;
    }

}