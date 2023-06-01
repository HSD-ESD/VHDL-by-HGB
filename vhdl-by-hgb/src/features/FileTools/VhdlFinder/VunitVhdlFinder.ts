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

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor() 
    {
        this.mVUnit = new VUnit();
    }

    public async GetVhdlFiles(workSpacePath: string) : Promise<VHDL_ProjectFiles> {

        if(!fs.existsSync(workSpacePath)) 
        {
            return new Map();
        }

        let projectFiles : VHDL_ProjectFiles = new Map<VHDL_Library, VHDL_Files>();

        const DirName = "VHDLbyHGB";
        const DirPath = path.join(workSpacePath, DirName);
        if(!fs.existsSync(DirPath))
        {
            fs.mkdirSync(DirPath);
        }
        const runPyPath = path.join(DirPath, "VHDLbyHGB.py");

        if(!fs.existsSync(runPyPath))
        {
            PythonGenerator.GenerateRunPy_VHDLbyHGB(runPyPath);
            await FileUtils.WaitForFileCreation(runPyPath);
        }

        const data : VunitExportData = await this.mVUnit.GetVunitData(workSpacePath, runPyPath);

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