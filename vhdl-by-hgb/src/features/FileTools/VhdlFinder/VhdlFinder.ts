import { VHDL_ProjectFiles } from "../../../Constants";

export interface IVhdlFinder {

    GetVhdlFilesFromProject(WorkSpacePath: string) : Promise<VHDL_ProjectFiles>

}