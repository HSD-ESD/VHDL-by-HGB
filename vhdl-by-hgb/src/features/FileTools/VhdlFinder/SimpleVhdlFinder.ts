//Specific Imports
import { IVhdlFinder } from "./VhdlFinder";
import { VhdlProjectFiles, VhdlLibraryContents, VhdlLibrary } from "./../../VHDLtools/VhdlPackage";
import { walk } from 'walk-file-tree';

//General Imports
import * as vscode from 'vscode';
import * as fs from 'fs';
import { HDLUtils } from "../HDLUtils";

//--------------------------------------------
//module-internal constants
//--------------------------------------------
const DEFAULT_LIBRARY_NAME = "lib";


export class SimpleVhdlFinder implements IVhdlFinder
{
    public async GetVhdlFiles(workSpacePath: string) : Promise<VhdlProjectFiles> 
	{

        let projectFiles : VhdlProjectFiles = new Map<VhdlLibrary, VhdlLibraryContents>();

        if(!fs.existsSync(workSpacePath)) 
        {
            return projectFiles;
        }

		let libContents : VhdlLibraryContents = await GetLibFiles(workSpacePath);
    	projectFiles.set(DEFAULT_LIBRARY_NAME, libContents);

		return projectFiles;
		
    }
}

async function GetLibFiles(libPath: string) : Promise<VhdlLibraryContents> {
	
	if(!fs.existsSync(libPath))
	{
		return {files:[]};
	}

	let libContents : VhdlLibraryContents = 
	{
		files:[]
	};

	//Walk through working-directory recursively
	for await (const entry of walk({
		directory: libPath,
		matches (entry) {
			return HDLUtils.IsVhdlFile(entry);
		},
		ignores (entry) {
			return IsBlackListed(entry);
		  }
		})) 
		{
			libContents.files.push(entry);
		}
	
	return libContents;
}

function IsBlackListed(file: string) : boolean {
    return file.includes('vunit');
}