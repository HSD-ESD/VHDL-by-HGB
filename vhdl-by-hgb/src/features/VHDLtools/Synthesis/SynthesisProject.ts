
import { VhdlEntity } from "../../VhdlDefinitions";
import { ISynthesisFactory } from "./Factory/SynthesisFactory";
import * as vscode from 'vscode';

export class TSynthesisProjectConfig {
    factory!     : ISynthesisFactory;
    name!        : string;
    folderPath!  : string;
};

export interface ISynthesisProject 
{
    Generate() : Promise<boolean>;
    
    UpdateFiles() : Promise<boolean>;

    LaunchGUI() : Promise<boolean>;

    Compile() : Promise<boolean>;

    SetTopLevelEntity(entity : VhdlEntity) : Promise<boolean>;

    SetFamily(family : string) : Promise<boolean>;

    SetDevice(device : string) : Promise<boolean>;
}

export abstract class SynthesisProject
{
    // --------------------------------------------
    // protected members
    // --------------------------------------------

    //essential members
    protected mName : string;
    protected mPath : string;

    //optional members
    protected mTopLevelEntity! : VhdlEntity;
    protected mFamily! : string;
    protected mDevice! : string;

    //vscode-members
    protected mOutputChannel : vscode.OutputChannel;
    protected mContext : vscode.ExtensionContext;

    // --------------------------------------------
    // protected methods
    // --------------------------------------------
    protected constructor(name : string, path : string, outputChannel : vscode.OutputChannel, context : vscode.ExtensionContext)
    {
        this.mName = name;
        this.mPath = path;

        this.mOutputChannel = outputChannel;
        this.mContext = context;
    }

    protected async GetDependencies(filePath: string): Promise<Set<string>> 
    {
      // store dependency-files in set to avoid duplicates
      let dependencies = new Set<string>();

      // add passed entity-file to dependencies
      dependencies.add(filePath);

      //TODO: parse packages and add to dependencies

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

      // add architecture-file to dependencies
      dependencies.add(implementation[0].uri.toString());

      //TODO: parse packages and add to dependencies

      // check for valid implementation-file
      if (!implementation) {
          return dependencies;
      }

      // Find all symbols in the implementation file
      const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
          'vscode.executeDocumentSymbolProvider',
          implementation[0].uri
      );

      // Find all entity instances in the symbols
      const instantiationSymbols = symbols.filter(symbol => symbol.kind === vscode.SymbolKind.Namespace);

      for (const symbol of instantiationSymbols) {

        //TODO: get associated entity-file for instantiated entity
        // let entityFilePath : string = symbol.GetEntityFilePath   // PSEUDO-CODE !!!
        
        // Recursively get dependencies of the entity's instances
        /*
        const entityDependencies = await this.GetDependencies(entityFilePath);
        entityDependencies.forEach(dep => dependencies.add(dep));
        */
      }
      
      return dependencies;
  }
        
}