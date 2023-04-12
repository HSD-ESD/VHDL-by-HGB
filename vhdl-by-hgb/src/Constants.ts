//--------------------------------------------------------------
//Global Constants
//--------------------------------------------------------------

//type-definitions for vhdl-files of a vhdl-project
export type VHDL_Library = string;
export type VHDL_Files = string[];
export type VHDL_ProjectFiles = Map<VHDL_Library, VHDL_Files>;

//Constants for VHDL_LS
export const VHDL_LS_FILE = "vhdl_ls.toml";

//Constants for UserData-Folder
export const UserDataFolder = "UserData";
export const SimulationDataFile = "SimulationData.toml";
export const SynthesisDataFile = "SynthesisData.toml";

//Constants for ProjectData-Folder
export const ProjectDataFolder = "ProjectData";

//Timer-Constants
export const StatusBarMessageTime = 5000;