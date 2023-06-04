//specific imports
import { eSimulationTool } from './SimulationPackage'; 

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


export class SimulationWizard 
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
        const def : WizardDefinition = getSimulationWizardDefinition(this.mContext);
        this.mWizard = new WebviewWizard("Simulation-Wizard", "Simulation Wizard", this.mContext, def, new Map<string,string>());
    }

    public async Run() : Promise<any> 
    {
        this.mWizard.open();
    }

}


export function getSimulationWizardDefinition(context: vscode.ExtensionContext) : WizardDefinition {
    let def : WizardDefinition = {
        title: "Simulation Wizard", 
        description: "Generate HDL-Simulation-Project",
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
            title: "Simulation-Project Configurator",
            description: "Settings for Library Mapping, Folder, Files...",
            fields: [
                {
                    id: "SimulationProjectType",
                    label: "ProjectType",
                    type: "select",
                    description: "Select Tool",
                    initialValue: "VUnit",
                    properties: {
                        options: Object.values(eSimulationTool)
                    }
                },
                {
                    id: "SimulationProjectLocation",
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
                    id: "SimulationProjectLibrariesLocation",
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
                    id: "SimulationProjectRtlWildcard",
                    label: "Rtl-Wildcard",
                    description: "Enter a glob-pattern for RTL-Files",
                    type: "textbox",
                    initialValue: "**/src/*.vhd",
                    placeholder: "**/src/*.vhd",
                },
                {
                    id: "SimulationProjectTbWildcard",
                    label: "Tb-Wildcard",
                    description: "Enter a glob-pattern for Tb-Files",
                    type: "textbox",
                    initialValue: "**/tb/*.vhd",
                    placeholder: "**/tb/*.vhd",
                },

            ],
            validator: (parameters:any) => {
                let items : ValidatorResponseItem[] = [];
                
                if(!fs.existsSync(parameters.SimulationProjectLocation))
                {
                    items.push(createValidationItem(SEVERITY.ERROR, "SimulationProjectLocation", 
                    "Invalid path for project-location"));
                }
                
                if(!fs.existsSync(parameters.SimulationProjectLibrariesLocation))
                {
                    items.push(createValidationItem(SEVERITY.ERROR, "SimulationProjectLibrariesLocation", 
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