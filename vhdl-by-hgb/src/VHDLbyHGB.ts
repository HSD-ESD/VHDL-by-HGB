//General Imports
import * as vscode from 'vscode';
import * as events from "events";
import * as path from 'path';

//Specific Imports
import {TOML_Generator} from './features/FileTools/TOML_Generator';
import {RustHDL} from './features/RustHDL';
import {ProjectManager} from './features/ProjectManager';

//Colibri-Imports
	//import * as Colibri from 'colibri2';
	//import { Multi_project_manager } from 'colibri2/project_manager/multi_project_manager';
	import * as teroshdl2 from 'teroshdl2';
	import { Multi_project_manager } from 'teroshdl2/out/project_manager/multi_project_manager';


//Colibri-Constants
	// const CONFIG_FILENAME = '.colibri2_config.json';
	// const PRJ_FILENAME = '.colibri2_prj.json';
	const CONFIG_FILENAME = '.teroshdl2_config.json';
	const PRJ_FILENAME = '.teroshdl2_prj.json';

export class VHDLbyHGB {

	//--------------------------------------------
	//Private Members
	//--------------------------------------------
    private mContext : vscode.ExtensionContext;
	private mRustHDL : RustHDL;
	private mProjectManager : ProjectManager;

	//private mMultiProjectManager : Multi_project_manager;
    private mEventEmitter : events.EventEmitter = new events.EventEmitter();


	//--------------------------------------------
	//Public Methods
	//--------------------------------------------
	constructor(context: vscode.ExtensionContext) 
	{
		this.mContext = context;
		this.mRustHDL = new RustHDL(this.mContext);
		this.mProjectManager = new ProjectManager();

		//Colibri-Init
		// const homedir = teroshdl2.utils.common.get_home_directory();
        // const file_config_path = path.join(homedir, CONFIG_FILENAME);
        // const file_prj_path = path.join(homedir, PRJ_FILENAME);
		// this.mMultiProjectManager = new Multi_project_manager("VHDLbyHGB",file_config_path, file_prj_path, this.mEventEmitter);
    }

	public Initialize() 
	{
		
		//init Language-Server: RustHDL
		this.RustHDL_Initialize();

		//init Formatter for VHDL
		this.VHDLFormatter_Initialize();

	}

	public Deactivate() : Thenable<void> | undefined
	{
		return this.mRustHDL.Deactivate();
	}

	//--------------------------------------------
	//Private Methods
	//--------------------------------------------
	private RustHDL_Initialize() 
	{ 
		const TomlGen = new TOML_Generator();

		// Generate Toml-File required by RustHDL
		// TomlGen.GenerateFile().then(
		// 	//Start language-server
		// 	response => { this.mRustHDL.Activate(); }
		// );

		this.mProjectManager.UpdateProjectFiles().then(
			//Start language-server
			response => { this.mRustHDL.Activate(); }
		);

	}

	private VHDLFormatter_Initialize() 
	{
		
	}

	private TreeViewManager_Initialize() 
	{ 

	}



}