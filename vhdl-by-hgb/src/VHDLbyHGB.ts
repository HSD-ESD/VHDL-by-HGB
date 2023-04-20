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

    private mEventEmitter : events.EventEmitter;


	//--------------------------------------------
	//Public Methods
	//--------------------------------------------
	constructor(context: vscode.ExtensionContext) 
	{
		this.mContext = context;
		this.mOutputChannel = vscode.window.createOutputChannel('VHDLbyHGB');
		this.mRustHDL = new RustHDL(this.mContext);
		this.mEventEmitter = new events.EventEmitter();
		this.mProjectManager = new ProjectManager(this.mContext, this.mOutputChannel);

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
	private async RustHDL_Initialize() 
	{ 
		
		this.mProjectManager.UpdateProjectFiles();

	}

	private async VHDLFormatter_Initialize() 
	{
		
	}

	private TreeViewManager_Initialize() 
	{ 

	}



}