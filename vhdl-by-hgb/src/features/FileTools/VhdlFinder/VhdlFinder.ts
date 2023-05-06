import { VHDL_ProjectFiles } from "../../../features/VhdlDefinitions";

export interface IVhdlFinder {

    GetVhdlFilesFromProject(WorkSpacePath: string) : Promise<VHDL_ProjectFiles>

}