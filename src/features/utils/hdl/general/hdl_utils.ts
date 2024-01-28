//general imports
import * as vscode from 'vscode';
import * as fs from 'fs';

//specific imports
import { SimpleVhdlParser } from '../parser/simple_vhdl_parser';
import { eVhdlDesignFileType } from '../../../hdl_tools/vhdl_package';

export class HDLUtils {

    public static async GetDependencies(filePath: string): Promise<Set<string>> 
    {
        // store dependency-files in set to avoid duplicates
        let dependencies = new Set<string>();

        if(filePath.length === 0 || !fs.existsSync(filePath))
        {
            return dependencies;
        }

        // add passed entity-file to dependencies
        dependencies.add(filePath);

        //parse packages and add to dependencies
        const EntityPackages = await SimpleVhdlParser.ParsePackages(filePath);
        EntityPackages.forEach((pack) => {
            dependencies.add(pack);
        });

        // get all document-symbols from a file
        const docSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            vscode.Uri.file(filePath)
        );

        // find entity-definition in file
        const entitySymbol = docSymbols.find(symbol =>
            symbol.kind === vscode.SymbolKind.Module 
        );

        // Find the implementation of the entity
        const implementation = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeImplementationProvider',
            vscode.Uri.file(filePath),
            entitySymbol?.range.start
        );

        // check for valid implementation-file
        if (!implementation) {
            return dependencies;
        }

        // add architecture-file to dependencies
        dependencies.add(implementation[0].uri.fsPath);

        //parse packages and add to dependencies
        const architecturePackages = await SimpleVhdlParser.ParsePackages(implementation[0].uri.fsPath);
        architecturePackages.forEach((pack) => {
            dependencies.add(pack);
        });

        // Find all symbols in the implementation file
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            implementation[0].uri
        );

        // Find all entity instances in the symbols
        const instantiationSymbols = symbols[0].children.filter(symbol => symbol.name.startsWith("instance"));

        for (const symbol of instantiationSymbols) 
        {
            const doc = await vscode.workspace.openTextDocument(implementation[0].uri);
            const startLine = symbol.range.start.line;
            const endLine = symbol.range.end.line;
            const instantiationRange = new vscode.Range(startLine, 0, endLine, doc.lineAt(endLine).range.end.character);
            const instantiationPath : string = await SimpleVhdlParser.ParseInstantiation(doc, instantiationRange);

            const entityDependencies = await HDLUtils.GetDependencies(instantiationPath);
            entityDependencies.forEach(dep => dependencies.add(dep));
        }

        return dependencies;
    }

    public static async GetSymbolInformation(symbol : string) : Promise<vscode.SymbolInformation[]>
    {
        const requestSymbol = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
            'vscode.executeWorkspaceSymbolProvider',
            symbol
        );

        return requestSymbol;
    }

    public static IsVhdlFile(filePath : string)
    {
        let isVhdl : boolean = false;

        const vhdlFileTypes = Object.values(eVhdlDesignFileType) as string[]; 

        vhdlFileTypes.forEach(
            (fileType) => {
                if(filePath.endsWith(fileType)) {isVhdl = true;}
            }
        );
        
        return isVhdl;
    }

}