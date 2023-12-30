'use strict';

import * as vscode from 'vscode';
import * as VHDLFormatter from './VHDLFormatter/VHDLFormatter';

export const CONFIGURATION_KEY = "vhdl-by-hgb.vhdl-formatter";
export const CONFIGURATION_INSERT_FINAL_NEW_LINE = "insertFinalNewline"; // Boolean
export const CONFIGURATION_REMOVE_COMMENTS = "remove.comments"; // Boolean
export const CONFIGURATION_REMOVE_BLANK_LINES = "remove.blankLines"; // Boolean
export const CONFIGURATION_REMOVE_REPORTS = "remove.reports"; // Boolean
export const CONFIGURATION_CHECK_ALIAS = "replaceByAliases"; // Boolean
export const CONFIGURATION_ALIGN_ALL_SIGN = "align.all"; // Boolean
export const CONFIGURATION_ALIGN_PORT_SIGN = "align.port"; // Boolean
export const CONFIGURATION_ALIGN_FUNCTION_SIGN = "align.function"; // Boolean
export const CONFIGURATION_ALIGN_PROCEDURE_SIGN = "align.procedure"; // Boolean
export const CONFIGURATION_ALIGN_GENERIC_SIGN = "align.generic"; // Boolean
export const CONFIGURATION_ALIGN_COMMENTS = "align.comments"; // Boolean
export const CONFIGURATION_ALIGN_SIGN_MODE = "align.mode"; // AlignMode
export const CONFIGURATION_NEWLINE_AFTER_PORT = "newline.port"; // NewLineConfig
export const CONFIGURATION_NEWLINE_AFTER_THEN = "newline.then"; // NewLineConfig
export const CONFIGURATION_NEWLINE_AFTER_SEMICOLON = "newline.semicolon"; // NewLineConfig
export const CONFIGURATION_NEWLINE_AFTER_ELSE = "newline.else"; // NewLineConfig
export const CONFIGURATION_NEWLINE_AFTER_GENERIC = "newline.generic"; // NewLineConfig
export const CONFIGURATION_CASE_KEYWORD = "case.keyword"; // CaseType
export const CONFIGURATION_CASE_TYPENAME = "case.typename"; // CaseType
export const CONFIGURATION_INDENTATION = "indentation"; // String

enum AlignMode
{
	Local,// = "local",
	Global,// = "global"
}

enum CaseType
{
	UpperCase,// = "UpperCase",
	LowerCase,// = "LowerCase",
	DefaultCase,// = "DefaultCase"
}

enum NewLineConfig
{
	NewLine,// = "NewLine",
	NoNewLine,// = "NoNewLine",
	None,// = "None"
}

export function getSettings<T>(section: string, key: string, defaultValue?: T): T
{
	return vscode.workspace.getConfiguration(section, null).get<T>(key, defaultValue as T);
}

export function getExtSettings<T>(key: string, defaultValue?: T): T
{
	return getSettings<T>(CONFIGURATION_KEY, key, defaultValue);
}

function getEndOfLine()
{
	var endOfLine = getSettings<string>("files", "eol", "\n");
	var isValid = endOfLine === "\r\n" || endOfLine === "\n";
	return isValid ? endOfLine : "\n";
}

function getIndentation(options)
{
	if (vscode.workspace.getConfiguration(CONFIGURATION_KEY, null).has(CONFIGURATION_INDENTATION))
	{
		const indent = vscode.workspace.getConfiguration(CONFIGURATION_KEY, null).get<string>(CONFIGURATION_INDENTATION); 
		if(indent) { return indent; }
	}

	if (!options.insertSpaces) { return "\t"; }
	var tabSize = options.tabSize;
	if (tabSize < 1) { tabSize = 4; }
	return " ".repeat(tabSize);
}

export function getConfig(options: vscode.FormattingOptions): VHDLFormatter.BeautifierSettings
{
	if (!options) { options = { insertSpaces: false, tabSize: 4 }; }

	const indentation = getIndentation(options);
	const endOfLine = getEndOfLine();

	const removeComments = getExtSettings<boolean>(CONFIGURATION_REMOVE_COMMENTS, false);
	const removeReports = getExtSettings<boolean>(CONFIGURATION_REMOVE_REPORTS, false);
	const checkAlias = getExtSettings<boolean>(CONFIGURATION_CHECK_ALIAS, false);
	const addNewLine = getExtSettings<boolean>(CONFIGURATION_INSERT_FINAL_NEW_LINE, false);

	const newLineAfterPort = getExtSettings<NewLineConfig>(CONFIGURATION_NEWLINE_AFTER_PORT, NewLineConfig.None);
	const newLineAfterThen = getExtSettings<NewLineConfig>(CONFIGURATION_NEWLINE_AFTER_THEN, NewLineConfig.NewLine);
	const newLineAfterSemicolon = getExtSettings<NewLineConfig>(CONFIGURATION_NEWLINE_AFTER_SEMICOLON, NewLineConfig.NewLine);
	const newLineAfterElse = getExtSettings<NewLineConfig>(CONFIGURATION_NEWLINE_AFTER_ELSE, NewLineConfig.NewLine);
	const newLineAfterGeneric = getExtSettings<NewLineConfig>(CONFIGURATION_NEWLINE_AFTER_GENERIC, NewLineConfig.None);

	const alignAllSign = getExtSettings<boolean>(CONFIGURATION_ALIGN_ALL_SIGN, false);
	const alignPortSign = getExtSettings<boolean>(CONFIGURATION_ALIGN_PORT_SIGN, false);
	const alignFunctionSign = getExtSettings<boolean>(CONFIGURATION_ALIGN_FUNCTION_SIGN, false);
	const alignProcedureSign = getExtSettings<boolean>(CONFIGURATION_ALIGN_PROCEDURE_SIGN, false);
	const alignGenericSign = getExtSettings<boolean>(CONFIGURATION_ALIGN_GENERIC_SIGN, false);
	const alignComments = getExtSettings<boolean>(CONFIGURATION_ALIGN_COMMENTS, false);
	const signAlignMode = getExtSettings<AlignMode>(CONFIGURATION_ALIGN_SIGN_MODE, AlignMode.Local).toString().toLowerCase();

	const keywordCase = getExtSettings<CaseType>(CONFIGURATION_CASE_KEYWORD, CaseType.UpperCase).toString().toLowerCase();
	const typenameCase = getExtSettings<CaseType>(CONFIGURATION_CASE_TYPENAME, CaseType.UpperCase).toString().toLowerCase();

	var newLineSettings = new VHDLFormatter.NewLineSettings();
	newLineSettings.push("generic", newLineAfterGeneric.toString());
	newLineSettings.push("generic map", newLineAfterGeneric.toString());
	newLineSettings.push("port", newLineAfterPort.toString());
	newLineSettings.push("port map", newLineAfterPort.toString());
	newLineSettings.push(";", newLineAfterSemicolon.toString());
	newLineSettings.push("then", newLineAfterThen.toString());
	newLineSettings.push("else", newLineAfterElse.toString());

	var signAlignKeywords : string[] = [];
	if (alignGenericSign) { signAlignKeywords.push("GENERIC"); }
	if (alignPortSign) { signAlignKeywords.push("PORT"); }
	if (alignProcedureSign) { signAlignKeywords.push("PROCEDURE"); }
	if (alignFunctionSign)
	{
		signAlignKeywords.push("FUNCTION");
		signAlignKeywords.push("IMPURE FUNCTION");
	}

	const alignSettings = new VHDLFormatter.signAlignSettings(signAlignKeywords.length > 0, alignAllSign, signAlignMode, signAlignKeywords, alignComments);
	return new VHDLFormatter.BeautifierSettings(removeComments, removeReports, checkAlias, alignSettings, keywordCase, typenameCase, indentation, newLineSettings, endOfLine, addNewLine);
}
