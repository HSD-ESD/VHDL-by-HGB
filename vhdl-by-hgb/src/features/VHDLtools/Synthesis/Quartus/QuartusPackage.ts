import { VhdlEntity } from "../../../VhdlDefinitions";

export class QuartusQsf {
    public path: string;
    public TopLevelEntity: VhdlEntity;
    public Family: string;
    public Device: string;
    public VhdlFiles: string[];
  
    public constructor() {
      this.path = "";
      this.TopLevelEntity = { mName: "", mPath: "" };
      this.Family = "";
      this.Device = "";
      this.VhdlFiles = [];
    }
  }