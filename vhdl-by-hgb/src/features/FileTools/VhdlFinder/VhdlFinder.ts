import { VHDL_ProjectFiles } from "../../../Constants";

export interface VhdlFinder {

    GetVhdlFilesFromProject(WorkSpacePath: string) : Promise<VHDL_ProjectFiles>

}