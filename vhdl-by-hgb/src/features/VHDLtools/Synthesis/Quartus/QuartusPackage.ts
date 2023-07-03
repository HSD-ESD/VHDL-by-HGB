import { VhdlEntity } from "../../../VhdlDefinitions";

export type QuartusQsf = {
    path : string;
    TopLevelEntity: VhdlEntity;
    Family: string;
    Device: string;
    VhdlFiles: string[];
};

export const cEmptyQsf : QuartusQsf = {
    path : "",
    TopLevelEntity : {mName : "", mPath : ""},
    Family : "",
    Device : "",
    VhdlFiles : []
};