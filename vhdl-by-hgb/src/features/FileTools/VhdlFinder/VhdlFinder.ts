import { VhdlProjectFiles } from "../../VHDLtools/VhdlPackage";

export interface IVhdlFinder {

    GetVhdlFiles(WorkSpacePath: string) : Promise<VhdlProjectFiles>

}