//specific imports
import { HDLRegression } from "../../VHDLtools/Simulation/HDLRegression/HDLRegression";
import { HDLRegressionFile } from "../../VHDLtools/Simulation/HDLRegression/HDLRegressionPackage";
import { VHDL_ProjectFiles, VHDL_Files, VHDL_Library } from "../../VHDLtools/VhdlPackage";

//general imports
import * as fs from 'fs';
import * as vscode from 'vscode';

export class HDLRegressionVhdlFinder {

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

    public async GetVhdlFiles(workSpacePath: string) : Promise<VHDL_ProjectFiles> 
    {

        let projectFiles : VHDL_ProjectFiles = new Map<VHDL_Library, VHDL_Files>();

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
                projectFiles.get(file.library_name)?.push(file.file_name);
            }
            else
            {
                projectFiles.set(file.library_name, [file.file_name]);
            }
        }

        return projectFiles;
    }

}