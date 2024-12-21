//Specific Imports
import { ISourceFinder } from "./source_finder";
import { VhdlProjectFiles, VhdlLibraryContents, VhdlLibrary, eVhdlDesignFileType } from "../../../hdl_tools/vhdl_package";
import { HDLUtils } from "../general/hdl_utils";

//General Imports
import * as fs from 'fs';
import * as vscode from 'vscode';

//--------------------------------------------
//module-internal constants
//--------------------------------------------
const DEFAULT_LIBRARY_NAME = "lib";


export class SimpleSourceFinder implements ISourceFinder
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

	const workspaceFolder = (vscode.workspace.workspaceFolders || [])[0];
	const vhdlFileTypes = Object.values(eVhdlDesignFileType) as string[]; 
	const filePattern = `**/*{${vhdlFileTypes.join(',')}}`;
	const results = await vscode.workspace.findFiles(
		new vscode.RelativePattern(workspaceFolder, filePattern),
	);
	let vhdlFiles : string[] = results.map((file) => {
		return file.fsPath;
	});

	libContents.files = vhdlFiles;
	
	return libContents;
}

function IsBlackListed(file: string) : boolean {
    return file.includes('vunit');
}