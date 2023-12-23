
//type-definitions for vhdl-files of a vhdl-project
export type VhdlLibrary = string;
export interface VhdlLibraryContents {
    files: string[];
    is_third_party?: boolean;
}
export type VhdlProjectFiles = Map<VhdlLibrary, VhdlLibraryContents>;

export class VhdlEntity {
    mName: string = "";
    mPath: string = "";
}

export const cVhdlFileTypes : string[] = [
    ".vhd",
    ".vhdl",
    ".vho"
];
