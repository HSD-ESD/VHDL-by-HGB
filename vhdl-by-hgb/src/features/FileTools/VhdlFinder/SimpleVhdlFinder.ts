//Specific Imports
import { IVhdlFinder } from "./VhdlFinder";
import { VHDL_ProjectFiles, VHDL_Files, VHDL_Library } from "./../../VHDLtools/VhdlPackage";
import { walk } from 'walk-file-tree';

//General Imports
import * as vscode from 'vscode';
import * as fs from 'fs';

//--------------------------------------------
//module-internal constants
//--------------------------------------------
const DEFAULT_LIBRARY_NAME = "lib";


export class SimpleVhdlFinder implements IVhdlFinder
{
    public async GetVhdlFiles(workSpacePath: string) : Promise<VHDL_ProjectFiles> {

        if(!fs.existsSync(workSpacePath)) 
        {
            return new Map();
        }

        let projectFiles : VHDL_ProjectFiles = new Map<VHDL_Library, VHDL_Files>();

		let files : VHDL_Files = await GetLibFiles(workSpacePath);
    	projectFiles.set(DEFAULT_LIBRARY_NAME, files);

		return projectFiles;
		
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