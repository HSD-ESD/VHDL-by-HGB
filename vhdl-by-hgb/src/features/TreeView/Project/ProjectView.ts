import { FileHolder } from "../../FileTools/FileHolder";
import * as vscode from 'vscode';
import * as path from 'path';


//provides the files for the tree view
export class ProjectViewProvider implements vscode.TreeDataProvider<ProjectItem>{
    
    private mWorkSpacePath : string;
    private mFileHolder : FileHolder;

    constructor(fileHolder : FileHolder, workspacePath : string){
        this.mWorkSpacePath = workspacePath;
        this.mFileHolder = fileHolder;
    }

    getTreeItem(element: ProjectItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ProjectItem): vscode.ProviderResult<ProjectItem[]> 
    {
        if(element){
            return element.children;
        }
        else{
            return this.fillRoots();
        }
    }

    private fillRoots(): ProjectItem[]{

        let libraries : LibraryItem[] = [];

        //check if projectfiles are not empty
        if(this.mFileHolder.GetProjectFiles().size !== 0){

            for(const [lib, files] of this.mFileHolder.GetProjectFiles()){

                const libraryItem : LibraryItem = new LibraryItem(lib,vscode.TreeItemCollapsibleState.Collapsed);

                for(const file of files){
                    const fileItem : FileItem = new FileItem(path.relative(this.mWorkSpacePath,file), vscode.TreeItemCollapsibleState.None);
                    libraryItem.children.push(fileItem);
                }

                libraries.push(libraryItem);
            }

            return libraries;
        }
        else{
            //return an empty array if there are no files
            return [];
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void > =
    new vscode.EventEmitter <FileItem | undefined | null | void >();

    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void{
        this._onDidChangeTreeData.fire();
    }
}


//this is the class that describes a single file
class ProjectItem extends vscode.TreeItem{

    public children : ProjectItem[] = [];

    constructor(
        public readonly itemName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState,
    ){
        super(itemName, collapsibleState);
    }
}

class FileItem extends ProjectItem{
    constructor(
        public readonly fileName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState
    )
    {
        super(fileName, collapsibleState);
    }
    
    iconPath = {
        light: path.join(__filename, '..' , '..', '..', '..', '..', 'resources' , 'images', 'project', 'light', 'file.svg'),
        dark: path.join(__filename, '..' , '..', '..', '..', '..', 'resources' , 'images', 'project', 'dark',  'file.svg')
    };

    tooltip = path.basename(this.fileName);
}

class LibraryItem extends ProjectItem{
    constructor(
        public readonly libraryName : string,
        public readonly collapsibleState : vscode.TreeItemCollapsibleState
    )
    {
        super(libraryName, collapsibleState);
    }
    
    iconPath = {
        light: path.join(__filename, '..' , '..', '..', '..', '..', 'resources' , 'images', 'project', 'light', 'library.svg'),
        dark: path.join(__filename, '..' , '..', '..', '..', '..', 'resources' , 'images', 'project', 'dark',  'library.svg')
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