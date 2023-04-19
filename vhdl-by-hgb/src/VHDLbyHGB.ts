//General Imports
import * as vscode from 'vscode';
import * as events from "events";
import * as path from 'path';

//Specific Imports
import {RustHDL} from './features/RustHDL';
import {ProjectManager} from './features/ProjectManager';

export class VHDLbyHGB {

	//--------------------------------------------
	//Private Members
	//--------------------------------------------
    private mContext : vscode.ExtensionContext;
	private mOutputChannel: vscode.OutputChannel;
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
		this.mOutputChannel = vscode.window.createOutputChannel('VHDLbyHGB');
		this.mRustHDL = new RustHDL(this.mContext);
		this.mProjectManager = new ProjectManager(this.mContext, this.mOutputChannel);

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