import { VhdlEntity } from "../../vhdl_package";

//folder for scripts
export const CustomQuartusTclScriptsFolder : string = "TclScriptsHGB";

export enum CustomQuartusTclScript {
    GenerateProject = "Generate.tcl",
    UpdateFiles = "UpdateFiles.tcl",
    LaunchGUI = "LaunchGUI.tcl",
    Compile = "Compile.tcl",
    TopLevelEntity = "TopLevel.tcl",
    Device = "Device.tcl",
    Family = "Family.tcl",
}

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