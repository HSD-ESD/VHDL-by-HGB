//General Imports
import * as vscode from 'vscode';
import * as path from 'path';

import * as fs from 'fs';

//Specific Imports
import { RustHDL } from './features/RustHDL';
import { VhdlFormatter } from './features/VhdlFormatter';
import {ProjectManager} from './features/ProjectManager';
import { EntityConverter } from './features/entity_converter';

export class VHDLbyHGB {

	//--------------------------------------------
	//Private Members
	//--------------------------------------------

	// vscode-members
    private mContext : vscode.ExtensionContext;
	private mOutputChannel: vscode.OutputChannel;

	// project-dependent tools
	private mProjectManager : ProjectManager;

	// project-independent tools
	private mFormatter : VhdlFormatter;
	private mEntityConverter : EntityConverter;

	//--------------------------------------------
	//Public Methods
	//--------------------------------------------
	constructor(context: vscode.ExtensionContext) {
		this.mContext = context;
		this.mOutputChannel = vscode.window.createOutputChannel('VHDLbyHGB');
		this.mFormatter = new VhdlFormatter(this.mContext);
		this.mEntityConverter = new EntityConverter(this.mContext);
		this.mProjectManager = new ProjectManager(this.mContext, this.mOutputChannel);
    }

	public async Initialize() : Promise<void>
	{
		this.mProjectManager.Initialize();
	}

	public Deactivate() : Thenable<void> | undefined
	{
		return this.mProjectManager.Deactivate();
	}

	//--------------------------------------------
	//Private Methods
	//--------------------------------------------

}