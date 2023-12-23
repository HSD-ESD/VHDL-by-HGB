// Specific Imports
import { FileHolder } from "../FileHolder";
import {VHDL_LS} from "../../vhdl_ls_package";
import { VhdlLibrary, VhdlLibraryContents, VhdlProjectFiles } from "../../VHDLtools/VhdlPackage";

// General Imports
import * as fs from 'fs';
import * as path from 'path';
import * as toml from '@iarna/toml';

// module-internal constants
const TOML_Files_Spec = "files = ";
const TOML_Open_Char = "[";
const TOML_Closing_Char = "]";
const TOML_Comma = ",";
const TOML_Quote = "\"";
const TOML_New_Line = "\n";
const TOML_Libraries = "libraries";
const TOML_Point = ".";
const TOML_Third_Party = ".is_third_party = true";

// module-internal types
interface TomlConfig {
    libraries: Record<string, VhdlLibraryContents>[];
}

export class TomlUtils {

    public static async Generate_VHDL_LS(fileHolder : FileHolder, workSpacePath : string, isRelativePaths: boolean = true) : Promise<void>
    {
        const FileName : string = path.join(workSpacePath, VHDL_LS.VHDL_LS_FILE);

        let wstream = fs.createWriteStream(FileName, { flags: 'w' });

        //print libraries-header
        wstream.write(TOML_Open_Char + TOML_Libraries + TOML_Closing_Char + TOML_New_Line);
		
        //Iterate over all libraries
        for(const [lib,lib_contents] of fileHolder.GetProjectFiles().entries())
        {
            //print file-header
            wstream.write(TOML_New_Line + lib + TOML_Point + TOML_Files_Spec + TOML_Open_Char + TOML_New_Line);
		    
            //Iterate over all files in a library
            for(let file of lib_contents.files)
            {
                wstream.write(TOML_Quote);

                if(isRelativePaths)
                {
                    //relative path
                    wstream.write(path.relative(workSpacePath,file).replace(/\\/g, '\\\\'));
                }
                else
                {
                    //absolute path
                    wstream.write(file.replace(/\\/g, '\\\\'));
                }

                wstream.write(TOML_Quote);
                wstream.write(TOML_Comma);
                wstream.write(TOML_New_Line);

            }
		    wstream.write(TOML_Closing_Char);
            wstream.write(TOML_New_Line);

            if (lib_contents.is_third_party)
            {
                wstream.write(lib + TOML_Third_Party);
                wstream.write(TOML_New_Line);
            }

        }

        //close writestream
        wstream.end();
    }

    public static Parse_VHDL_LS(filePath : string) : VhdlProjectFiles
    {
        const tomlString = fs.readFileSync(filePath, 'utf8');
        const parsedToml = toml.parse(tomlString) as unknown as TomlConfig;
        const projectFiles = convertTomlDataToLibraryMapping(parsedToml);
        return projectFiles;
    }

}

function convertTomlDataToLibraryMapping(tomlData : TomlConfig) : VhdlProjectFiles
{
    const projectFiles: VhdlProjectFiles = new Map<VhdlLibrary, VhdlLibraryContents>();

    for (const [libraryName, libraryConfig] of Object.entries(tomlData.libraries)) 
    {
        let libContents : VhdlLibraryContents = {
            files : libraryConfig.files as unknown as string[],
            is_third_party : libraryConfig.is_third_party as unknown as boolean,
        };

        projectFiles.set(libraryName, libContents);
    }

    return projectFiles;
}