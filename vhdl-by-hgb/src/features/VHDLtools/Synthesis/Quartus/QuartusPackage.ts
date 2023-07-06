import { VhdlEntity } from "../../VhdlPackage";

export class QuartusQsf {
    public Path: string;
    public TopLevelEntity: VhdlEntity;
    public Family: string;
    public Device: string;
    public VhdlFiles: string[];
  
    public constructor(path : string) {
      this.Path = path;
      this.TopLevelEntity = { mName: "", mPath: "" };
      this.Family = "";
      this.Device = "";
      this.VhdlFiles = [];
    }
  }