const Lexer = require('snapdragon-lexer');

import * as vscode from 'vscode';

export class VhdlParser {

    public ParseInstantiation(document : vscode.TextDocument, range : vscode.Range) : string
    {
        const textInRange = document.getText(range); // Text innerhalb der Range extrahieren
        const lexer = new Lexer(textInRange); // Lexer mit dem extrahierten Text initialisieren

        let token = lexer.next();
        
        // parse until end of string
        while (token.type !== 'eos') {
            
            // parse until colon ":" occurs
            while(token.value !== ":" && token.type !== 'eos')
            {
                token = token.next();
            }

            // check, if instantiated item is entity
            if(token.peek().value === "entity")
            {
                //skip entity-symbol
                token = token.skip(1);

                while(token.value !== "." && token.type !== 'eos')
                {
                    token = token.next();
                }

                //return entity-name
                return token.next().value;
            }
            // else, item is a component
            else
            {
                
            }

        }

        return "";
    }

}