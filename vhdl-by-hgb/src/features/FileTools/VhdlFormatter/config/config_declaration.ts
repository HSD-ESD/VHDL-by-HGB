/* eslint-disable max-len */
// Copyright 2023
// Carlos Alberto Ruiz Naranjo [carlosruiznaranjo@gmail.com]
// Ismael Perez Rojo [ismaelprojo@gmail.com]
//
// This file is part of TerosHDL
//
// Colibri is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Colibri is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with TerosHDL.  If not, see <https://www.gnu.org/licenses/>.
    
export type e_editor_general = {
    stutter_comment_shortcuts : boolean,
    stutter_block_width : number,
    stutter_max_width : number,
    stutter_delimiters : boolean,
    stutter_bracket_shortcuts : boolean,
};
    
export type e_formatter_standalone = {
    keyword_case : e_formatter_standalone_keyword_case,
    name_case : e_formatter_standalone_name_case,
    indentation : string,
    align_port_generic : boolean,
    align_comment : boolean,
    remove_comments : boolean,
    remove_reports : boolean,
    check_alias : boolean,
    new_line_after_then : e_formatter_standalone_new_line_after_then,
    new_line_after_semicolon : e_formatter_standalone_new_line_after_semicolon,
    new_line_after_else : e_formatter_standalone_new_line_after_else,
    new_line_after_port : e_formatter_standalone_new_line_after_port,
    new_line_after_generic : e_formatter_standalone_new_line_after_generic,
};
    
export type e_formatter_svg = {
    configuration : string,
    core_number : number,
    aditional_arguments : string,
};
    
export enum e_formatter_general_formatter_vhdl {
    standalone = "standalone",
    vsg = "vsg",
}

export enum e_formatter_standalone_keyword_case {
    lowercase = "lowercase",
    uppercase = "uppercase",
}
export enum e_formatter_standalone_name_case {
    lowercase = "lowercase",
    uppercase = "uppercase",
}
export enum e_formatter_standalone_new_line_after_then {
    new_line = "new_line",
    no_new_line = "no_new_line",
    none = "none",
}
export enum e_formatter_standalone_new_line_after_semicolon {
    new_line = "new_line",
    no_new_line = "no_new_line",
    none = "none",
}
export enum e_formatter_standalone_new_line_after_else {
    new_line = "new_line",
    no_new_line = "no_new_line",
    none = "none",
}
export enum e_formatter_standalone_new_line_after_port {
    new_line = "new_line",
    no_new_line = "no_new_line",
    none = "none",
}
export enum e_formatter_standalone_new_line_after_generic {
    new_line = "new_line",
    no_new_line = "no_new_line",
    none = "none",
}

