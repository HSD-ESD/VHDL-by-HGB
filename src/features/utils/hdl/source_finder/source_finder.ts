import { VhdlProjectFiles } from "../../../hdl_tools/vhdl_package";

export interface ISourceFinder {

    GetVhdlFiles(WorkSpacePath: string) : Promise<VhdlProjectFiles>

}