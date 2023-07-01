
//type-definitions for vhdl-files of a vhdl-project
export type VHDL_Library = string;
export type VHDL_Files = string[];
export type VHDL_ProjectFiles = Map<VHDL_Library, VHDL_Files>;

export const cVhdlFileTypes : string[] = [
    ".vhd",
    ".vhdl",
    ".vho"
];