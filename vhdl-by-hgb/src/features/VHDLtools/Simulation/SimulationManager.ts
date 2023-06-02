
//general imports
import * as vscode from 'vscode';
import * as path from 'path';
import { VUnit } from './VUnit/VUnit';


export class SimulationManager {

    // --------------------------------------------
    // Private members
    // --------------------------------------------

    //general
    private mWorkSpacePath : string = "";
    private mOutputChannel : vscode.OutputChannel;

    //vscode-members
    private mContext : vscode.ExtensionContext;
    private mVUnitWatcher : vscode.FileSystemWatcher;

    //VUnit
    private mVUnit : VUnit;
    private mVUnitProjects : Array<string>;
    private mActiveVUnitProject : string = "";

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    constructor(context : vscode.ExtensionContext)
    {
        //init vs-code members
        this.mContext = context;
        this.mOutputChannel = vscode.window.createOutputChannel('VHDLbyHGB:Simulation');

        //init specific members
        this.mVUnit = new VUnit();
        this.mVUnitProjects = new Array<string>();

        //get workspace path
        const workspaceFolder = (vscode.workspace.workspaceFolders || [])[0];
        let wsRoot: string | undefined = undefined;
        if (workspaceFolder) {
            this.mWorkSpacePath = workspaceFolder.uri.fsPath;
        }

        //watch all python files
        this.mVUnitWatcher = vscode.workspace.createFileSystemWatcher(path.join(this.mWorkSpacePath, "**/*.py"));
        
        //handle events for VUnitWatcher
        this.mVUnitWatcher.onDidCreate( (uri) => {
            if(uri.fsPath.endsWith("run.py"))
            {
                this.Update();
            }
        });
        this.mVUnitWatcher.onDidDelete( (uri) => {
            if(uri.fsPath.endsWith("run.py"))
            {
                this.Update();
            }
        });

        // Start watching the workspace-folder
        const disposable = vscode.Disposable.from(this.mVUnitWatcher);
        // Dispose the watcher when extension is not active
        context.subscriptions.push(disposable);

    }


    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private async Update() : Promise<void> {
        
        const files = await this.mVUnit.FindRunPy((vscode.workspace.workspaceFolders || [])[0]);
        
        if(files)
        {
            this.mVUnitProjects = files;
        }
    }
    

}