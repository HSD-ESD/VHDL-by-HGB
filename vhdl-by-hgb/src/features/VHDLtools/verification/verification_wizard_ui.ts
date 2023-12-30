//specific imports
import { eVerificationTool } from './verification_package'; 

import {    UPDATE_TITLE, 
            BUTTONS, 
            SEVERITY, 
            ValidatorResponseItem, 
            WebviewWizard, 
            WizardDefinition,
            IWizardPage, 
            PerformFinishResponse } from '@redhat-developer/vscode-wizard';
import { FieldDefinitionState } from '@redhat-developer/vscode-wizard/lib/WebviewWizard';

//general imports
import * as vscode from 'vscode';
import * as fs from 'fs';


export class VerificationWizardUi
{

    // --------------------------------------------
    // Private members
    // --------------------------------------------
    private mContext : vscode.ExtensionContext;
    private mWizard : WebviewWizard;

    // --------------------------------------------
    // Public methods
    // --------------------------------------------
    public constructor(context : vscode.ExtensionContext) {
        this.mContext = context;
        const def : WizardDefinition = getVerificationWizardDefinition(this.mContext);
        this.mWizard = new WebviewWizard("Verification-Wizard", "Verification Wizard", this.mContext, def, new Map<string,string>());
    }

    public async Run() : Promise<any> 
    {
        this.mWizard.open();
    }

}


export function getVerificationWizardDefinition(context: vscode.ExtensionContext) : WizardDefinition {
    let def : WizardDefinition = {
        title: "Verification Wizard", 
        description: "Generate HDL-Verification-Project",
        workflowManager: {
        canFinish(wizard:WebviewWizard, data: any): boolean {
            return true;
        },
        performFinish(wizard:WebviewWizard, data: any): Promise<PerformFinishResponse | null> {
            vscode.window.showInformationMessage(JSON.stringify(data));
            return new Promise<PerformFinishResponse | null>((res,rej) => {
                res(null);
            });
        },
        getNextPage(page:IWizardPage, data: any): IWizardPage | null {
            return null;
        },
        getPreviousPage(page:IWizardPage, data: any): IWizardPage | null {
            return null;
        }
        },
        pages: [
        {
            id: 'page1',
            title: "Verification-Project Configurator",
            description: "Settings for Library Mapping, Folder, Files...",
            fields: [
                {
                    id: "VerificationProjectType",
                    label: "ProjectType",
                    type: "select",
                    description: "Select Tool",
                    initialValue: "VUnit",
                    properties: {
                        options: Object.values(eVerificationTool)
                    }
                },
                {
                    id: "VerificationProjectLocation",
                    label: "Project Location",
                    initialValue: "",
                    type: "file-picker",
                    placeholder: "Select folder",
                    dialogOptions: {
                        canSelectMany: false,
                        canSelectFiles: false,
                        canSelectFolders: true,
                        openLabel: "Select Folder"
                    }
                },
                {
                    id: "VerificationProjectLibrariesLocation",
                    label: "Location of Libraries",
                    initialValue: "",
                    type: "file-picker",
                    placeholder: "Select Folder containing all Libraries",
                    dialogOptions: {
                        canSelectMany: false,
                        canSelectFiles: false,
                        canSelectFolders: true,
                        openLabel: "Select Folder"
                    }
                },
                {
                    id: "VerificationProjectRtlWildcard",
                    label: "Rtl-Wildcard",
                    description: "Enter a glob-pattern for RTL-Files",
                    type: "textbox",
                    initialValue: "**/src/*.vhd",
                    placeholder: "**/src/*.vhd",
                },
                {
                    id: "VerificationProjectTbWildcard",
                    label: "Tb-Wildcard",
                    description: "Enter a glob-pattern for Tb-Files",
                    type: "textbox",
                    initialValue: "**/tb/*.vhd",
                    placeholder: "**/tb/*.vhd",
                },

            ],
            validator: (parameters:any) => {
                let items : ValidatorResponseItem[] = [];
                
                if(!fs.existsSync(parameters.VerificationProjectLocation))
                {
                    items.push(createValidationItem(SEVERITY.ERROR, "VerificationProjectLocation", 
                    "Invalid path for project-location"));
                }
                
                if(!fs.existsSync(parameters.VerificationProjectLibrariesLocation))
                {
                    items.push(createValidationItem(SEVERITY.ERROR, "VerificationProjectLibrariesLocation", 
                    "Invalid path for location of libraries"));
                }

                return { items: items };
            }
            }
        ]
    };
    return def;
}

export function createValidationItem(sev: SEVERITY, id: string, content: string): ValidatorResponseItem {
    return {
        severity: sev,
        template: {
            id: id,
            content: content
        }
    };
}