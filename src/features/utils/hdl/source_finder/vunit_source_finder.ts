//specific imports
import { VUnit } from "../../../hdl_tools/verification/vunit/vunit";
import { VUnitExportData } from "../../../hdl_tools/verification/vunit/vunit_package";
import { VhdlProjectFiles, VhdlLibraryContents, VhdlLibrary } from "../../../hdl_tools/vhdl_package";
import { ISourceFinder } from "./source_finder";

//general imports
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class VUnitSourceFinder implements ISourceFinder {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mRunPyPath : string;
    private mOutputChannel : vscode.OutputChannel;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(runPyPath : string, outputChannel : vscode.OutputChannel) 
    {
        this.mRunPyPath = runPyPath;
        this.mOutputChannel = outputChannel;
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

        const data : VUnitExportData = await VUnit.GetData(workSpacePath, this.mRunPyPath, this.mOutputChannel);
        
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