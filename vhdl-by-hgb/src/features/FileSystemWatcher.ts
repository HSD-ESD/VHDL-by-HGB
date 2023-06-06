import * as vscode from 'vscode';
import * as path from 'path';

export class FileSysWatcher {
    //--------------------------------------------
    //Private Members
    //--------------------------------------------
    private mTomlWatcher: any;

    private mVHDLWatcher: any;
    //--------------------------------------------
    //Public Methods
    //--------------------------------------------
    public constructor(context: vscode.ExtensionContext) {
        if (vscode.workspace.workspaceFolders !== undefined) {
            const workspace = vscode.workspace.workspaceFolders[0].uri.fsPath;

            // check all VHDL files
            //const filePattern = workspace + '**/*.vhd';
            const filePattern = '**/*.vhd';
            this.mVHDLWatcher = vscode.workspace.createFileSystemWatcher(filePattern);

            const tomlPath = path.join(workspace, "vhdl_ls.toml");

            this.mTomlWatcher = vscode.workspace.createFileSystemWatcher(tomlPath);
        }
    }

    public async getVHDLWatcher() {
        return this.mVHDLWatcher;
    }

    public async getTomlWatcher() {
        return this.mTomlWatcher;
    }

    public async compareContents(previous: any, current: any) {
        // Implementiere den Vergleich der Inhalte und gib den Unterschied zurück
        // Hier ein vereinfachtes Beispiel, das einfach die gesamten Inhalte vergleicht
        if (previous === current) {
            return 'Keine Änderungen';
        } else {
            return `Vorheriger Inhalt: ${previous}\nAktueller Inhalt: ${current}`;
        }
    }

}