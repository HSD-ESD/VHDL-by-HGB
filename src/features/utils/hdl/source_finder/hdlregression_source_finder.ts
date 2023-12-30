//specific imports
import { HDLRegression } from "../../../hdl_tools/verification/hdlregression/hdlregression";
import { HDLRegressionFile } from "../../../hdl_tools/verification/hdlregression/hdlregression_package";
import { VhdlProjectFiles, VhdlLibraryContents, VhdlLibrary } from "../../../hdl_tools/vhdl_package";
import { ISourceFinder } from "./source_finder";

//general imports
import * as fs from 'fs';
import * as vscode from 'vscode';

export class HDLRegressionSourceFinder implements ISourceFinder {

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