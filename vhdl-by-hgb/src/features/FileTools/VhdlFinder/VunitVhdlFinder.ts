//specific imports
import { VUnit } from "../../VHDLtools/Simulation/VUnit/VUnit";
import { VunitExportData } from "../../VHDLtools/Simulation/VUnit/VUnitPackage";
import { VHDL_ProjectFiles, VHDL_Files, VHDL_Library } from "../../VHDLtools/VhdlPackage";

//general imports
import * as fs from 'fs';
import * as path from 'path';
import { PythonGenerator } from "../FileGenerator/PythonGenerator";
import { FileUtils } from "../FileUtils";

export class VunitVhdlFinder {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mVUnit : VUnit;
    private mRunPyPath : string;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(runPyPath : string) 
    {
        this.mVUnit = new VUnit();
        this.mRunPyPath = runPyPath;
    }

    public async GetVhdlFiles(workSpacePath: string) : Promise<VHDL_ProjectFiles> {

        if(!fs.existsSync(workSpacePath)) 
        {
            return new Map();
        }

        let projectFiles : VHDL_ProjectFiles = new Map<VHDL_Library, VHDL_Files>();

        if(!fs.existsSync(this.mRunPyPath))
        {
            return projectFiles;
        }

        const data : VunitExportData = await this.mVUnit.GetVunitData(workSpacePath, this.mRunPyPath);

        for (const file of data.files)
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