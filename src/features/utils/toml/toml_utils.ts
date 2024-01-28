// specific imports
import { SourceManager } from "../../project/source_manager";
import { vhdl_ls } from "../../lsp/vhdl_ls_package";
import { VhdlLibrary, VhdlLibraryContents, VhdlProjectFiles } from "../../hdl_tools/vhdl_package";

// general imports
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

    public static Generate_VHDL_LS(sourceManager : SourceManager, workSpacePath : string, isRelativePaths: boolean = true) : void
    {
        const tomlPath : string = path.join(workSpacePath, vhdl_ls.VHDL_LS_FILE);
        let tomlString : string = "";

        //print libraries-header
        tomlString += "[" + TOML_Libraries + "]" + "\n";
        
        //Iterate over all libraries
        for(const [lib,lib_contents] of sourceManager.GetProjectFiles().entries())
        {
            //print file-header
            tomlString += "\n" + lib + "." + TOML_Files_Spec + "[" + "\n";
            
            //Iterate over all files in a library
            for(let file of lib_contents.files)
            {
                tomlString += "\"";

                if(isRelativePaths)
                {
                    //relative path
                    tomlString += path.relative(workSpacePath,file).replace(/\\/g, '\\\\');
                }
                else
                {
                    //absolute path
                    tomlString += file.replace(/\\/g, '\\\\');
                }

                tomlString += "\"";
                tomlString += ",";
                tomlString += "\n";

            }
            tomlString += "]";
            tomlString += "\n";

            if (lib_contents.is_third_party)
            {
                tomlString += lib + TOML_Third_Party;
                tomlString += "\n";
            }

        }

        fs.writeFileSync(tomlPath, tomlString);
    }

    public static Parse_VHDL_LS(filePath : string) : VhdlProjectFiles
    {
        const tomlString = fs.readFileSync(filePath, 'utf8');
        const parsedToml = toml.parse(tomlString) as unknown as TomlConfig;
        const projectFiles = convertTomlDataToProjectFiles(parsedToml);
        return projectFiles;
    }

}

function convertTomlDataToProjectFiles(tomlData : TomlConfig) : VhdlProjectFiles
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