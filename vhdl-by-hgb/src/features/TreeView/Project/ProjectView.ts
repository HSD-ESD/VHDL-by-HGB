import { FileHolder } from "../../FileTools/FileHolder";
import * as vscode from 'vscode';
import * as path from 'path';


//provides the files for the tree view
export class FileProvider implements vscode.TreeDataProvider<File>{
    
    private mFileHolder : FileHolder;

    constructor(fileHolder : FileHolder){
        this.mFileHolder = fileHolder;
    }

    getTreeItem(element: File): vscode.TreeItem {
        return element;
    }

    getChildren(element?: File): Thenable<File[]> {
        return Promise.resolve(this.getFilesFromFileHolder());
    }

    private getFilesFromFileHolder(): File[]{
        const _files : File[] = [];

        //check if projectfiles are not empty
        if(this.mFileHolder.GetProjectFiles().size !== 0){

            for(const [lib, files] of this.mFileHolder.GetProjectFiles().entries()){

                for(let file of files){
                    _files.push(new File(file, vscode.TreeItemCollapsibleState.None));
                }
            }

            return _files;
        }
        else{
            //return an empty array if there are no files
            return [];
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<File | undefined | null | void > =
    new vscode.EventEmitter <File | undefined | null | void >();

    readonly onDidChangeTreeData: vscode.Event<File | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void{
        this._onDidChangeTreeData.fire();
    }
}


//this is the class that describes a single file
class File extends vscode.TreeItem{
    constructor(
        public readonly fileName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState
    )
    {
        super(fileName, collapsibleState);
    }
    
    iconPath = {
        light: path.join(__filename, '..' , '..', '..', '..', 'resources' , 'images', 'project', 'light', 'file.svg'),
        dark: path.join(__filename, '..' , '..', '..', '..', 'resources' , 'images', 'project', 'dark',  'file.svg')
    };
}

class Folder extends vscode.TreeItem{

    constructor(
        public readonly folderName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState
    )
    {
        super(folderName, collapsibleState);
    }
}