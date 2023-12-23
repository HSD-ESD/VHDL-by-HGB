//General Imports
import * as vscode from 'vscode';
import * as path from 'path';

import * as fs from 'fs';

//Specific Imports
import {RustHDL} from './features/RustHDL';
import {ProjectManager} from './features/ProjectManager';
import { EntityConverter } from './features/entity_converter';
import { VHDLFormatterHGB } from './features/formatter/vhdl_formatter_hgb';

export class VHDLbyHGB {

	//--------------------------------------------
	//Private Members
	//--------------------------------------------

	// vscode-members
    private mContext : vscode.ExtensionContext;
	private mOutputChannel: vscode.OutputChannel;

	// project-independent tools
	private mFormatter : VHDLFormatterHGB;
	private mEntityConverter : EntityConverter;

	// project-dependent tools
	private mProjectManager : ProjectManager;

	//--------------------------------------------
	//Public Methods
	//--------------------------------------------
	constructor(context: vscode.ExtensionContext) 
	{
		// vscode-members
		this.mContext = context;
		this.mOutputChannel = vscode.window.createOutputChannel('VHDLbyHGB');
		// project-independent tools
		this.mFormatter = new VHDLFormatterHGB(context);
		this.mEntityConverter = new EntityConverter(this.mContext);
		// project-dependent tools
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