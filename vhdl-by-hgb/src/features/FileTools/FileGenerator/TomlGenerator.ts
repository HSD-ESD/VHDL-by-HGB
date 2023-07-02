// Specific Imports
import { FileHolder } from "../FileHolder";
import * as Constants from "../../../Constants";

// General Imports
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// module-internal constants
const TOML_Files_Spec = "files = ";
const TOML_Open_Char = "[";
const TOML_Closing_Char = "]";
const TOML_Comma = ",";
const TOML_Quote = "\"";
const TOML_New_Line = "\n";
const TOML_Libraries = "libraries";
const TOML_Point = ".";



export class TomlGenerator {

    public static async Generate_VHDL_LS(fileHolder : FileHolder, workSpacePath : string, isRelativePaths: boolean = true) : Promise<void>
    {
        const FileName : string = path.join(workSpacePath, Constants.VHDL_LS_FILE);

        let wstream = fs.createWriteStream(FileName, { flags: 'w' });
		
        //Iterate over all libraries
        for(const [lib,files] of fileHolder.GetProjectFiles().entries())
        {
            //print library name
		    wstream.write(TOML_Open_Char + TOML_Libraries + TOML_Point + lib + TOML_Closing_Char + TOML_New_Line);

            //print file-header
            wstream.write(TOML_Files_Spec + TOML_Open_Char + TOML_New_Line);
		    
            //Iterate over all files in a library
            for(let file of files)
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
            wstream.write(TOML_New_Line);
        }

        //close writestream
        wstream.end();
    }

}