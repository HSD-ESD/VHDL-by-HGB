//specific imports
import { HDLRegression } from "../../VHDLtools/Simulation/HDLRegression/HDLRegression";
import { HDLRegressionFile } from "../../VHDLtools/Simulation/HDLRegression/HDLRegressionPackage";
import { VhdlProjectFiles, VhdlLibraryContents, VhdlLibrary } from "../../VHDLtools/VhdlPackage";
import { IVhdlFinder } from "./VhdlFinder";

//general imports
import * as fs from 'fs';
import * as vscode from 'vscode';

export class HDLRegressionVhdlFinder implements IVhdlFinder {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mHDLRegression : HDLRegression;
    private mHDLRegressionScriptPath : string;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(hdlregressionScriptPath : string, outputChannel : vscode.OutputChannel) 
    {
        this.mHDLRegression = new HDLRegression(outputChannel);
        this.mHDLRegressionScriptPath = hdlregressionScriptPath;
    }

    public async GetVhdlFiles(workSpacePath: string) : Promise<VhdlProjectFiles> 
    {

        let projectFiles : VhdlProjectFiles = new Map<VhdlLibrary, VhdlLibraryContents>();

        if(!fs.existsSync(workSpacePath)) 
        {
            return projectFiles;
        }

        if(!fs.existsSync(this.mHDLRegressionScriptPath))
        {
            return projectFiles;
        }

        const data : HDLRegressionFile[] = await this.mHDLRegression.GetFiles(this.mHDLRegressionScriptPath);

        for (const file of data)
        {
            if (projectFiles.has(file.library_name))
            {
                projectFiles.get(file.library_name)?.files.push(file.file_name);
            }
            else
            {
                projectFiles.set(file.library_name, {files:[file.file_name]});
            }
        }

        return projectFiles;
    }

}