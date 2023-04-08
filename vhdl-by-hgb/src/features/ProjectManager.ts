import * as vscode from 'vscode';

export class ProjectManager {

    private WorkSpacePath : string = "";
    

    public constructor() 
    {
        if(vscode.workspace.workspaceFolders !== undefined)
        {
            this.WorkSpacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        }
    }


}