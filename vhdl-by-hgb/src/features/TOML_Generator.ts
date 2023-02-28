//import {PythonShell} from 'python-shell';

import * as vscode from 'vscode';
import {ExtensionContext} from 'vscode';
import * as path from 'path';
//let pyshell = new PythonShell('my_script.py');

import { walk } from 'walk-file-tree';
import * as fs from 'fs';

// module-internal constants
const TOML_File_Name = "vhdl_ls.toml";
const TOML_Files_Spec = "files = "
const TOML_Open_Char = "[\n";
const TOML_Closing_Char = "]";
const TOML_Comma = ",\n";
const TOML_Quote = "\"";

const Lib_Name = "[libraries.lib]\n";


// export function GenerateTOMLfile(ctx: ExtensionContext) : void
// {
// 	//Get path of workspace-folder of the user
// 	let wf = vscode.workspace.workspaceFolders[0].uri.path ;

// 	let options = {
// 		scriptPath: ctx.asAbsolutePath(path.join('client','src', 'VUNIThelpers')),
// 		args: [wf]	//path to the WorkSpaceFolder of the user
// 	  };

// 	  PythonShell.run('my_script.py', options).then(messages=>{
// 		// results is an array consisting of messages collected during execution
// 			//console.log('results: %j', results);
// 		});
// }


export class TOML_Generator 
{

	public async GenerateFile(IsRelativePaths: boolean = true) : Promise<void> {

		let wf : string;

		//Get path of workspace-folder of the user
		if(vscode.workspace.workspaceFolders) {
			wf = vscode.workspace.workspaceFolders[0].uri.fsPath;
		}
		else {
			console.log("no workspace folder found");
			return;
		}
		let FILE_PATH = wf + "/" + TOML_File_Name;
	
		let wstream = fs.createWriteStream(FILE_PATH, { flags: 'w' });
		
		wstream.write(Lib_Name);
		wstream.write(TOML_Files_Spec);
		wstream.write(TOML_Open_Char);
		
		//Walk through working-directory recursively
		for await (const entry of walk({
		directory: wf,
		matches (entry) {
			return entry.endsWith('.vhd');
		},
		ignores (entry) {
			return entry.includes('vunit');
		  }
		})) {
			wstream.write(TOML_Quote);
			
			if(IsRelativePaths)
			{
				//relative path
				wstream.write(path.relative(wf,entry).replace(/\\/g, '\\\\'));
			}
			else
			{
				//absolute path
				wstream.write(entry.replace(/\\/g, '\\\\'));
			}
			wstream.write(TOML_Quote);
			wstream.write(TOML_Comma);
		}
		
		wstream.write(TOML_Closing_Char);
	
	}
	
}

 




