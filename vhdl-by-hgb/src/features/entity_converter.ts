
// general imports
import { sync } from 'glob';
import * as vscode from 'vscode';

// specific imports
import * as EntityUtils from './FileTools/entity_utils';


export class EntityConverter {

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mContext : vscode.ExtensionContext;
    private mDebugInfo : boolean;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(context: vscode.ExtensionContext) 
    {
        this.mContext = context;
        this.mDebugInfo = false;

        this.RegisterCommands();
    }

    // --------------------------------------------
    // Private methods
    // --------------------------------------------
    private RegisterCommands() : void
    {
        let disposable : vscode.Disposable;

        disposable = vscode.commands.registerCommand('VHDLbyHGB.copyEntity', () => this.copyEntity());
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('VHDLbyHGB.pasteAsInstance', () => this.pasteAsInstance());
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('VHDLbyHGB.pasteAsComponent', () => this.pasteAsComponent());
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('VHDLbyHGB.pasteAsEntity', () => this.pasteAsEntity());
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('VHDLbyHGB.pasteSignals', () => this.pasteSignals);
        this.mContext.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('VHDLbyHGB.pasteConstants', () => this.pasteConstants());
        this.mContext.subscriptions.push(disposable);

    }

    private copyEntity() : void
    {
        const entityUtils = new EntityUtils.EntityUtils("copyEntity");
        entityUtils.copyPorts();
        vscode.window.showInformationMessage(`${entityUtils.name} copied`);
    }

    private pasteAsInstance() : void
    {
        const entityUtils = new EntityUtils.EntityUtils("pasteAsInstance");
        var vhdText = "";

        vscode.env.clipboard.readText().then(
            (text)=>{
                vhdText = entityUtils.pasteInstance(text);
                insertString(vhdText);

                if(this.mDebugInfo)
                {
                    console.log(vhdText);
                }
                vscode.window.showInformationMessage(`${entityUtils.name} pasted as instance`);
            }
        );
    }

    private pasteAsComponent() : void 
    {
        const entityUtils = new EntityUtils.EntityUtils("pasteAsComponent");
        var vhdText = "";

        vscode.env.clipboard.readText().then(
            (text)=>{
                vhdText = entityUtils.pasteComponent(text);
                insertString(vhdText);

                if(this.mDebugInfo)
                {
                    console.log(vhdText);
                }
                vscode.window.showInformationMessage(`${entityUtils.name} pasted as component`);
            }
        );
    }

    private pasteAsEntity() : void 
    {
        const entityUtils = new EntityUtils.EntityUtils("pasteAsEntity");
        var vhdText = "";
        vscode.env.clipboard.readText().then(
            (text)=>{
                vhdText = entityUtils.pasteEntity(text);
                insertString(vhdText);

                if(this.mDebugInfo)
                {
                    console.log(vhdText);
                }
                vscode.window.showInformationMessage(`${entityUtils.name} pasted as entity`);
            }
        );
    }

    private pasteSignals() : void 
    {
        const entityUtils = new EntityUtils.EntityUtils("pasteSignals");
        var vhdText = "";
        vscode.env.clipboard.readText().then(
            (text)=>{
                vhdText = entityUtils.pasteSignals(text);
                insertString(vhdText);

                if(this.mDebugInfo)
                {
                    console.log(vhdText);
                }
                vscode.window.showInformationMessage(`signals of ${entityUtils.name} pasted`);
            }
        );
    }

    private pasteConstants() : void 
    {
        const entityUtils = new EntityUtils.EntityUtils("pasteConstants");
        var vhdText = "";
        vscode.env.clipboard.readText().then(
            (text)=>{
                vhdText = entityUtils.pasteConstants(text);
                insertString(vhdText);

                if(this.mDebugInfo)
                {
                    console.log(vhdText);
                }
                vscode.window.showInformationMessage(`constants of ${entityUtils.name} pasted`);
            }
        );
    }

}

function insertString(text: string) 
{
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        editor.edit(editBuilder => {
            // Position (line, character)
            editBuilder.insert(new vscode.Position(editor.selection.active.line, 0), text);
        });
    }
}

