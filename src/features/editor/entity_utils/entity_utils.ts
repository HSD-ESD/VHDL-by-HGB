import { dir } from 'console';
import * as vscode from 'vscode';
// import { insidersDownloadDirToExecutablePath } from 'vscode-test/out/util';
// import * as hdlParser from 'parser';
// const hdlParser = require('./parser.js');

interface VhdObject {
	objType : string;
	name? : string;
	dir? : string;
	type? : string;
	val? : string;
	comment? : string;
}

const USE_COMMENTS : boolean = false;
const COMMENT = "--";


export class EntityUtils {
	COMPONENT_GENERIC_INIT : boolean = false;
	msg : string  = "";
	indent1 : string = "  ";
	indent2 : string = "  ";
	name : String  = "";
	vhdGenericLines : Array<VhdObject> = [];
	vhdPortLines: Array<VhdObject> = [];
	eol: string = "";


	expressions : Array<String> = ["entity", "component"];

	constructor(msg:string){
		this.msg = msg;
		const activeEditor = vscode.window.activeTextEditor;
		
		if (activeEditor) {
			var indentStr = "";
			if (activeEditor?.options.insertSpaces){
				indentStr = "";				
				if ( typeof activeEditor?.options.tabSize === 'number'){
					for (let iter = activeEditor?.options.tabSize; iter > 0; iter--){
						indentStr += " ";
					}
				} else {
					indentStr = "  ";
				}
			} else {
				indentStr= '\t';
			}


			this.indent1 = indentStr;
			this.indent2 = indentStr + indentStr;
			if (activeEditor?.document.eol === 1) {
				this.eol = "\n";
			} else {
				this.eol = "\r\n";
			}
		}
	}

	setName(name:String){
		this.name = name;
	}

	vhdObjectToLine(objType:string, vhdObj:VhdObject){
		let ret:string = "";
		if (objType === "generic"){
			if (vhdObj.name){
				ret += vhdObj.name;
				ret += " : ";
				ret += vhdObj.type;
				if(vhdObj.val){
					ret += " := ";
					ret += vhdObj.val;
				} 
	
				ret += " ; ";
			}

			if(vhdObj.comment) {
				ret += vhdObj.comment;
			}
				
		} else if (objType === "port"){
			ret += vhdObj.name;
			ret += " : ";
			ret += vhdObj.dir;
			ret += " ";
			ret += vhdObj.type;
			ret += " ; ";
			if(vhdObj.comment) {
				ret += vhdObj.comment;
			}
		}
		return ret;
	}

	greeting(){
		vscode.window.showInformationMessage(this.msg);
	}

	_getMaxLength(vhdObjList:Array<VhdObject>, key="name"){
		let max = 0;

		for(let vhdObj of vhdObjList){
			if (vhdObj.name !== undefined){
				if(vhdObj.name.length > max){
					max = vhdObj.name.length;
				}
			}
		}

		return max;
	}

	_syntaxError(msg:String){
		let errorMsg = "Syntax Error!!!";
		if (msg.length > 0){
			errorMsg = "Syntax Error: " + msg;
		} else {
			errorMsg = "SyntaxError!!!";
		}
		vscode.window.showErrorMessage(errorMsg);
		console.error(errorMsg);
	}

	_findClosingIdx(text:Array<string>, startIdx:number){
		let endIdx = 0;
		let bracketCount = 0;
		for(let idx = startIdx; idx < text.length; idx++){
			if( text[idx].match("\\(")){
				bracketCount++;
			} else if( text[idx].match("\\)")){
				bracketCount--;
			}
			if (bracketCount === 0){
				endIdx = idx;
				break;
			}

			if (idx === text.length){
				this._syntaxError("ERROR with brackets!!!");
				break;
			}
		}


		return endIdx;
	}

	_parseVHDL(input:string){
		// console.log(text);

		let ifType = "";
		let objName = "";
		let objType = "";
		let objValue = "";
		let objDir = "";
		let idx = 0;
		let closingIdx = 0;

		let state = "init";

		let text = this._sepString(input);
		text = text.filter( n => n !== '\n'); // get rid of the line endings
		// for first version: no comments allowed
		// console.log(text);
		parsing_loop:
		while(idx < text.length){
			switch (state) {
				case "init":
					// set interface Entity or component
					idx = 0;
					ifType = text[idx].toLowerCase();

					// Entity name
					idx = 1;
					this.name = text[idx];

					idx += 1;
					// ist there an "is" after Entity name?
					if (text[idx].toLowerCase() === "is"){
						idx += 1;
					}
				
				case "find_opening":

					if (text[idx].toLowerCase().match("generic") || text[idx].toLowerCase().match("port")){
						objType = text[idx].toLowerCase();
						idx++;
					} else {
						this._syntaxError("Port|Generic expected.");
						return false;
					}

					if ( text[idx].match("\\(") ) {
						closingIdx = this._findClosingIdx(text, idx);
						idx++;
					} else {
						this._syntaxError(" \"(\"  expected after Port|Generic.");
						return false;
					}
					
					if ( objType.match("generic") ){
						state = "set_generic_objects";
					} else if( objType.match("port") ){
						state = "set_port_objects";
					} else {
						this._syntaxError("Port|Generic error.");
						return false;
					}
					break;

				case "set_generic_objects":
					
					while(idx < closingIdx){
						objType = "";
						objName = text[idx];
						objValue = "";

						idx++;

						if( text[idx].match(":") ){
							idx++;
						} else {
							this._syntaxError( objName + " Missing \":\" with " );
							return false;
						}

						// set type and value
						while(idx < closingIdx){
							if ( text[idx].match(";") ){
								idx++;
								break;
							}else if (text[idx].match(":=")){
								// Set Value
								idx++;
								while(idx < closingIdx){
									if ( text[idx].match(";") ){
										idx++;
										break;
									} else {
										// Set Value
										// add spaces before and after the numbers
										if ( text[idx].match("=>")  ){
											objValue += " " + text[idx] + " ";
										} else{
											objValue += text[idx];
										}
										idx++;
									}
								}
								break;
							} else {
								// Set Type
								// add spaces before and after the numbers
								if ( text[idx].toLowerCase().match("^downto$|^to$") ){
									objType += " " + text[idx] + " ";
								} else{
									objType += text[idx];
								}
								idx++;
							}
						}
						this.vhdGenericLines.push({objType:"generic", type:objType, name:objName, val:objValue});

					}

					idx++;
					if( text[idx].match(";") ){
						state = "find_opening";
						idx++;
					} else {
						this._syntaxError("Generic closing missing \")\" or \";\"");
						return false;
					}
				   
					break;

				case "set_port_objects":
					
					while(idx < closingIdx){
						objType = "";
						objName = text[idx];
						objDir = "";

						idx++;

						if( text[idx].match(":") ){
							idx++;
						} else {
							this._syntaxError( objName + " Missing \":\" with " );
							return false;
						}

						// set direction
						if( text[idx].toLowerCase().match("^in$|^out$|^inout$|^buffer$") ){
							objDir= text[idx];
							idx++;
						}

						// set type 
						while(idx < closingIdx){
							if ( text[idx].match(";") ){
								idx++;
								break;
							} else {
								// Set Type
								// add spaces before and after the numbers
								if ( text[idx].toLowerCase().match("^downto$|^to$") ){
									objType += " " + text[idx] + " ";
								} else{
									objType += text[idx];
								}
								idx++;
							}
						}
						this.vhdPortLines.push({objType:"port", type:objType, name:objName, dir:objDir});

					}
					break parsing_loop;


			
				default:
					break;
			}
		}

		return true;

		// let jsonString = JSON.stringify({"name":this.name, "vhdGenericLines":this.vhdGenericLines, "vhdPortLines":this.vhdGenericLines});
		// vscode.env.clipboard.writeText(jsonString);
	}
	
	_myReplace(text: string, symbol: string, replace: string) {
		var re_comment = new RegExp(symbol, "g");
		return text.replace(re_comment, replace);
	}

	_sepString(text:string){
		// console.log(text.length);
		let ret: Array<string> = [];
		let tmp: Array<string> = [];

		// Symbols to seperate the strings
		text = this._myReplace(text, "\r", "\n");
		text = this._myReplace(text, "\t", " ");
		text = this._myReplace(text, "\n", " \n ");
		text = this._myReplace(text, ":", " : ");
		text = this._myReplace(text, "=", " = ");
		text = this._myReplace(text, ":  =", " := ");
		text = this._myReplace(text, ":=", " := ");
		text = this._myReplace(text, ";", " ; ");
		text = this._myReplace(text, "\\(", " ( ");
		text = this._myReplace(text, "\\)", " ) ");
		text = this._myReplace(text, COMMENT, " " + COMMENT + " ");

		tmp = text.split(' ').filter( n => n ); // get rid of the empty spaces
		// console.log(text)
		for (let i = 0; i < text.length; i++) {
			// get rid of the comments
			if (tmp[i] === COMMENT) {
				for (; tmp[i] !== "\n"; i++) { }
				continue;
			}
			ret.push(tmp[i]);
		}
		// console.log(ret)
		return ret;
	}

	// todo rework
	copyPorts(){

		const editor = vscode.window.activeTextEditor;
	
		if (editor) {
			const document = editor.document;
			
			if (editor.selection.isEmpty){
				const position = editor.selection.active;
				const line_text = document.getText().split('\n');
				var start_num  = 0;
				var end_num  = 0;

				var mstr = "";

				const doc_length = line_text.length;

				
				find_startpoint_loop:
				for (var idx = position.line; idx >= 0; idx--) {

					var spl_txt = line_text[idx].replace(/\t/g, ' ').split(' ').filter(
						// Filter empty elements
						function (el){
							if (el.length > 0){
								return el;
							}
						});

					for (var i of ["entity", "component"] ){
						
						try{
							if (spl_txt[0].toLowerCase() === i ) {
								// console.debug(i + ": found");
								start_num = idx;
								// console.log(spl_txt);
								break find_startpoint_loop;
							}
						} catch(error){
							
						}
					}
				}

				// console.debug("start_num ", start_num);


				find_endpoint_loop:
				for (var idx = start_num; idx < doc_length ; idx++){

					mstr += line_text[idx] + '\n';

					var spl_txt = line_text[idx].replace(/\t/g, ' ').split(' ').filter(
						// Filter empty elements
						function (el){
							if (el.length > 0){
								return el;
							}
						}); 
					// console.log(spl_txt);
					
					
					// find last line
					for (var i of ["end"] ){
						try{
							if (spl_txt[0].toLowerCase() === i ) {
								// console.debug(i + ": found");
								start_num = idx;
								break find_endpoint_loop;
							}
						} catch(erro){
							
						}
					}
				}
				
				vscode.env.clipboard.writeText(mstr);
				console.log("Port Copy done!");
				// console.log(mstr);
				
				//only parse for setting name of entity
				this._parseVHDL(mstr);
			}

		}

	}

	pasteComponent(text:string){
		let parseOK = this._parseVHDL(text);
		if (! parseOK ){
			return "";
		}


		let maxlen = 0;
		let rep = 0;
		let vhdText = "";
		let name;
		vhdText += "component " + this.name + " is"+ this.eol;

		
		if (this.vhdGenericLines.length > 0){
			maxlen = this._getMaxLength(this.vhdGenericLines);
		
			for(let idx = 0; idx < this.vhdGenericLines.length; idx++){
				if (idx === 0){
					vhdText += this.indent1 + "generic(" + this.eol;
				}

				// Name may be undefined
				name = this.vhdGenericLines[idx].name;
				if (name !== undefined){
					rep = maxlen - name.length;
				}
				vhdText += this.indent2 + this.vhdGenericLines[idx].name + " ".repeat(rep) + " : " + this.vhdGenericLines[idx].type;

				if (this.COMPONENT_GENERIC_INIT) {
					if(this.vhdGenericLines[idx].val){
						vhdText += " := " + this.vhdGenericLines[idx].val;
					}
				}

				if( idx < this.vhdGenericLines.length-1){
					vhdText += ";" + this.eol;
				}else{
					vhdText += this.eol + this.indent1 + ");" + this.eol;
				}
			}
		}
		
		if (this.vhdPortLines.length > 0){
			maxlen = this._getMaxLength(this.vhdPortLines);
		
			for(let idx = 0; idx < this.vhdPortLines.length; idx++){
				if (idx === 0){
					vhdText += this.indent1 + "port(" + this.eol;
				}

				// Name may be undefined
				name = this.vhdPortLines[idx].name;
				if (name !== undefined){
					rep = maxlen - name.length;
				}
				vhdText += this.indent2 + this.vhdPortLines[idx].name + " ".repeat(rep) + " : " + this.vhdPortLines[idx].dir + " " + this.vhdPortLines[idx].type;

				// Set Port ending
				if( idx < this.vhdPortLines.length-1){
					vhdText += ";" + this.eol;
				}else{
					vhdText += this.eol + this.indent1 + ");" + this.eol;
				}
			}
		}
		vhdText += "end component " + this.name + ";" + this.eol;
		return vhdText;
	}
	
	pasteInstance(text:string){
		let parseOK = this._parseVHDL(text);
		if (! parseOK ){
			return "";
		}
		let maxlen = 0;
		let rep = 0;
		let vhdText = "";
		let name;
		vhdText += "i_" + this.name + " : " + this.name + this.eol;

		if (this.vhdGenericLines.length > 0){
			maxlen = this._getMaxLength(this.vhdGenericLines);
			vhdText += this.indent1 + "generic map(" + this.eol;
		
			for(let idx = 0; idx < this.vhdGenericLines.length; idx++){
				// Name may be undefined
				name = this.vhdGenericLines[idx].name;
				if (name !== undefined){
					rep = maxlen - name.length;
				}
				vhdText += this.indent2 + this.vhdGenericLines[idx].name + " ".repeat(rep) + " => " + this.vhdGenericLines[idx].name;

				if( idx < this.vhdGenericLines.length-1){
					vhdText += "," + this.eol;
				}else{
					vhdText += this.eol + this.indent1 + ")" + this.eol;
				}
			}
		}

		if (this.vhdPortLines.length > 0){
			maxlen = this._getMaxLength(this.vhdPortLines);
			vhdText += this.indent1 + "port map(" + this.eol;
		
			for(let idx = 0; idx < this.vhdPortLines.length; idx++){
				// Name may be undefined
				name = this.vhdPortLines[idx].name;
				if (name !== undefined){
					rep = maxlen - name.length;
				}
				vhdText += this.indent2 + this.vhdPortLines[idx].name + " ".repeat(rep) + " => " + this.vhdPortLines[idx].name;

				if( idx < this.vhdPortLines.length-1){
					vhdText += "," + this.eol;
				}else{
					vhdText += this.eol + ");" + this.eol;
				}
			}
		}
		
		return vhdText;
	}

	pasteEntity(text:string){
		let parseOK = this._parseVHDL(text);
		if (! parseOK ){
			return "";
		}
		let maxlen = 0;
		let rep = 0;
		let vhdText = "";
		let name;
		vhdText += "entity " + this.name + " is"+ this.eol;

		if (this.vhdGenericLines.length > 0){
			maxlen = this._getMaxLength(this.vhdGenericLines);
		
			for(let idx = 0; idx < this.vhdGenericLines.length; idx++){
				if (idx === 0){
					vhdText += this.indent1 + "generic(" + this.eol;
				}

				// Name may be undefined
				name = this.vhdGenericLines[idx].name;
				if (name !== undefined){
					rep = maxlen - name.length;
				}
				vhdText += this.indent2 + this.vhdGenericLines[idx].name + " ".repeat(rep) + " : " + this.vhdGenericLines[idx].type;

				if(this.vhdGenericLines[idx].val){
					vhdText += " := " + this.vhdGenericLines[idx].val;
				}

				if( idx < this.vhdGenericLines.length-1){
					vhdText += ";" + this.eol;
				}else{
					vhdText += this.eol + this.indent1 + ");" + this.eol;
				}
			}
		}
		
		if (this.vhdPortLines.length > 0){
			maxlen = this._getMaxLength(this.vhdPortLines);
		
			for(let idx = 0; idx < this.vhdPortLines.length; idx++){
				if (idx === 0){
					vhdText += this.indent1 + "port(" + this.eol;
				}

				// Name may be undefined
				name = this.vhdPortLines[idx].name;
				if (name !== undefined){
					rep = maxlen - name.length;
				}
				vhdText += this.indent2 + this.vhdPortLines[idx].name + " ".repeat(rep) + " : " + this.vhdPortLines[idx].dir + " " + this.vhdPortLines[idx].type;

				// Set Port ending
				if( idx < this.vhdPortLines.length-1){
					vhdText += ";" + this.eol;
				}else{
					vhdText += this.eol + this.indent1 + ");" + this.eol;
				}
			}
		}
		vhdText += "end " + this.name + ";" + this.eol;
		return vhdText;
	}

	pasteSignals(text:string){

		console.log(text);

		let parseOK = this._parseVHDL(text);
		if (! parseOK ){
			return "";
		}
		let maxlen = 0;
		let rep = 0;
		let vhdText = "";
		let name;
		
		if (this.vhdPortLines.length > 0){
			maxlen = this._getMaxLength(this.vhdPortLines);
		
			for(let idx = 0; idx < this.vhdPortLines.length; idx++){
				name = this.vhdPortLines[idx].name;
				if (name !== undefined){
					rep = maxlen - name.length;
				}
				// vhdText += "signal " + this.vhdPortLines[idx].name + " ".repeat(rep) + " : "  + " " + this.vhdPortLines[idx].type + "; -- " + this.vhdPortLines[idx].dir + this.eol;
				vhdText += "signal " + this.vhdPortLines[idx].name + " ".repeat(rep) + " : "  + " " + this.vhdPortLines[idx].type + ";" + this.eol;
			}
		}
		return vhdText;
	}

	pasteConstants(text:string){
		let parseOK = this._parseVHDL(text);
		if (! parseOK ){
			return "";
		}
		let maxlen = 0;
		let rep = 0;
		let vhdText = "";
		let name;
		
		if (this.vhdGenericLines.length > 0){
			maxlen = this._getMaxLength(this.vhdGenericLines);
		
			for(let idx = 0; idx < this.vhdGenericLines.length; idx++){
				name = this.vhdGenericLines[idx].name;
				if (name !== undefined){
					rep = maxlen - name.length;
				}
				vhdText += "constant " + this.vhdGenericLines[idx].name + " ".repeat(rep) + " : "  + " " + this.vhdGenericLines[idx].type;

				if(this.vhdGenericLines[idx].val){
					vhdText += " := " + this.vhdGenericLines[idx].val;
				}

				vhdText += ";" + this.eol;
			}
		}
		return vhdText;
	}

}