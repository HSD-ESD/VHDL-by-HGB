//const Lexer = require('snapdragon-lexer');
import * as Lexer from 'snapdragon-lexer';

// general imports
import * as vscode from 'vscode';

//module-internal constants
const cPackageRegex = /use\s+work\.(\w+(\.\w+)*(\.all)?);/;
const cEntityRegex = /entity\s+(\w+)/i;
const cComponentRegex = /component\s+(\w+)/i;
const cInstantiationRegex = /(?:entity|component)\s+(\w+(?:\.\w+)*)/i;

export class VhdlParser {

    public static async ParsePackages(filePath : string) : Promise<string[]>
    {
        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        const text = document.getText();
        const lines = text.split('\n');

        let packages : string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = cPackageRegex.exec(line);
            
            if (match) {
                const packageName = match[1];
            
                const packageFile = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                document.uri,
                new vscode.Position(i, line.indexOf(packageName)),
                );

                if(packageFile[0])
                {
                    packages.push(packageFile[0].uri.fsPath);
                }
            }
        }

        return packages;
    }

    public static async ParseInstantiation(document : vscode.TextDocument, range : vscode.Range) : Promise<string>
    {
        const textInRange = document.getText(range);
        const lines = textInRange.split('\n');

        for (let i = 0; i < lines.length; i++) 
        {
            const line = lines[i];
            const instanceMatch = cInstantiationRegex.exec(line);

            if (instanceMatch) 
            {
                const libraryMappedInstanceType = instanceMatch[1];
                const instanceType : string = libraryMappedInstanceType.split('.')[1];

                const definitionLocations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                document.uri,
                new vscode.Position(range.start.line + i, line.lastIndexOf(instanceType)),
                );
                    
                if (definitionLocations && definitionLocations.length > 0) 
                {
                    return definitionLocations[0].uri.fsPath;
                }
            }
        }

        return "";
    }

}