//Specific Imports
import { VHDL_ProjectFiles, VHDL_Files, VHDL_Library } from "../../Constants";
import { walk } from 'walk-file-tree';

//General Imports
import * as vscode from 'vscode';
import * as fs from 'fs';

//--------------------------------------------
//module-internal constants
//--------------------------------------------
const DEFAULT_LIBRARY_NAME = "lib";


export class VhdlFileFinder
{
    public static async GetVhdlFilesFromProject(WorkSpacePath: string) : VHDL_ProjectFiles {

        if(!fs.existsSync(WorkSpacePath)) 
        {
            return new Map();
        }

        let ProjectFiles : VHDL_ProjectFiles = new Map<VHDL_Library, VHDL_Files>();
		
		//Walk through working-directory recursively
		for await (const entry of walk({
		directory: WorkSpacePath,
		matches (entry) {
			return IsVhdlFile(entry);
		},
		ignores (entry) {
			return IsBlackListed(entry);
		  }
		})) {
			
			let files : VHDL_Files | undefined = ProjectFiles.get(DEFAULT_LIBRARY_NAME);

			//add file, if library exists
			if(files !== undefined)
			{
				files.push(entry);
			}
			//create new library, if library does not exist yet
			else 
			{
				//create new library
				let files : VHDL_Files = new Array<string>();
				files.push(entry);
				ProjectFiles.set(DEFAULT_LIBRARY_NAME, files);
			}

			
		}
    }
}

async function GetLibFiles(libPath: string) : Promise<VHDL_Files> {
	
	if(!fs.existsSync(libPath))
	{
		return new Array<string>();
	}

	let files : VHDL_Files = new Array<string>();

	//Walk through working-directory recursively
	for await (const entry of walk({
		directory: libPath,
		matches (entry) {
			return IsVhdlFile(entry);
		},
		ignores (entry) {
			return IsBlackListed(entry);
		  }
		})) 
		{
			files.push(entry);
		}
	
	return files;
}

function IsVhdlFile(file: string) : boolean {
    return file.endsWith('.vhd');
}

function IsBlackListed(file: string) : boolean {
    return file.includes('vunit');
}