import { VHDL_ProjectFiles } from "../../VHDLtools/VhdlPackage";

export interface IVhdlFinder {

    GetVhdlFiles(WorkSpacePath: string) : Promise<VHDL_ProjectFiles>

}