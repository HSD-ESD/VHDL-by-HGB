//specific imports
import { VUnit } from "../../VHDLtools/Simulation/VUnit/VUnit";
import { VUnitExportData } from "../../VHDLtools/Simulation/VUnit/VUnitPackage";
import { VhdlProjectFiles, VhdlLibraryContents, VhdlLibrary } from "../../VHDLtools/VhdlPackage";
import { IVhdlFinder } from "./VhdlFinder";
import { VHDL_LS } from "./../../vhdl_ls_package";

//general imports
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class VUnitVhdlFinder implements IVhdlFinder {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mVUnit : VUnit;
    private mRunPyPath : string;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(runPyPath : string, outputChannel : vscode.OutputChannel) 
    {
        this.mVUnit = new VUnit(outputChannel);
        this.mRunPyPath = runPyPath;
    }

    public async GetVhdlFiles(workSpacePath: string) : Promise<VhdlProjectFiles> 
    {

        let projectFiles : VhdlProjectFiles = new Map<VhdlLibrary, VhdlLibraryContents>();

        if(!fs.existsSync(workSpacePath)) 
        {
            return new Map();
        }

        if(!fs.existsSync(this.mRunPyPath))
        {
            return projectFiles;
        }

        const data : VUnitExportData = await this.mVUnit.GetData(workSpacePath, this.mRunPyPath);
        
        for (const file of data.files)
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