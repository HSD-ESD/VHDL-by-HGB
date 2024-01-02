// general imports
import * as fs from 'fs';

//module-internal constants
const DEFAULT_LIBRARY_NAME = "lib";
const PROJECT_PATH = "PROJECT_PATH";
const cGetProjectPath = "Path(__file__).resolve().parents[1]";

const cImportPathLib = "from pathlib import Path";
const cImportVUnit = "from vunit import VUnit";

const cVUnitFromArgv = "VU = VUnit.from_argv()";
const cVUnitAddLibray = "VU.add_library";
const cVUNitAddSourceFiles = ".add_source_files";
const cVUnitMain = "VU.main()";

export class PythonGenerator {
    
    public static GenerateRunPy_VHDLbyHGB(runPyPath : string) : boolean
    {
        let wstream : fs.WriteStream = fs.createWriteStream(runPyPath);
        
        if(!wstream.writable)
        {
            return false;
        }

        wstream.write(cImportPathLib + '\n');
        wstream.write(cImportVUnit + '\n\n');

        wstream.write(cVUnitFromArgv + '\n\n');

        wstream.write(PROJECT_PATH + " = " + cGetProjectPath + '\n\n');

        wstream.write(DEFAULT_LIBRARY_NAME + " = " + cVUnitAddLibray + "(\"" + DEFAULT_LIBRARY_NAME + "\")" +'\n\n');

        wstream.write(DEFAULT_LIBRARY_NAME + cVUNitAddSourceFiles + "(" + PROJECT_PATH + " / \"*\" / \"*.vhd\"" +  ")" + '\n\n');

        wstream.write(cVUnitMain + "\n");

        wstream.end();

        return true;
    }

}