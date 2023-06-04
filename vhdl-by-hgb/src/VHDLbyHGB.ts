//General Imports
import * as vscode from 'vscode';
import * as events from "events";
import * as path from 'path';

import * as fs from 'fs';

//Specific Imports
import { RustHDL } from './features/RustHDL';
import { VhdlFormatter } from './features/VhdlFormatter';
import { ProjectManager } from './features/ProjectManager';

export class VHDLbyHGB {

	//--------------------------------------------
	//Private Members
	//--------------------------------------------
	private mContext: vscode.ExtensionContext;
	private mOutputChannel: vscode.OutputChannel;
	private mRustHDL: RustHDL;
	private mProjectManager: ProjectManager;
	private mFormatter: VhdlFormatter;
	private mEventEmitter: events.EventEmitter;


	//--------------------------------------------
	//Public Methods
	//--------------------------------------------
	constructor(context: vscode.ExtensionContext) {
		this.mContext = context;
		this.mOutputChannel = vscode.window.createOutputChannel('VHDLbyHGB');
		this.mRustHDL = new RustHDL(this.mContext);
		this.mFormatter = new VhdlFormatter(this.mContext);
		this.mEventEmitter = new events.EventEmitter();
		this.mProjectManager = new ProjectManager(this.mContext, this.mOutputChannel);
    }

	public async Initialize() : Promise<void>
	{
		this.mProjectManager.Initialize();
	}

	public async Initialize() {
		//await this.mOutputFromLs.GetOutput();
	}

	public Deactivate(): Thenable<void> | undefined {
		return this.mRustHDL.Deactivate();
	}

	//--------------------------------------------
	//Private Methods
	//--------------------------------------------

}