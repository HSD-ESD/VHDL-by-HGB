//general imports
import * as vscode from 'vscode';

//specific imports
import { ProjectManager } from './features/project/project_manager';
import { EntityConverter } from './features/editor/entity_utils/entity_converter';
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

		// register commands
		this.RegisterCommands();
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
	private RegisterCommands() : void
    {
        let disposable : vscode.Disposable;

        // marketing
        disposable = vscode.commands.registerCommand("HGB.Extensions.VUnit", () => SearchVUnitByHGB());
        this.mContext.subscriptions.push(disposable);
		disposable = vscode.commands.registerCommand("HGB.Extensions.HDLRegression", () => SearchHDLRegressionByHGB());
        this.mContext.subscriptions.push(disposable);
    }
	
}

//--------------------------------------------
// functions
//--------------------------------------------
function SearchVUnitByHGB() : void
{
	vscode.commands.executeCommand('workbench.extensions.search', 'vunit-by-hgb');
}

function SearchHDLRegressionByHGB() : void
{
	vscode.commands.executeCommand('workbench.extensions.search', 'hdlregression-by-hgb');
}