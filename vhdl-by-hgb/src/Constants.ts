//--------------------------------------------------------------
//Global Constants
//--------------------------------------------------------------

//type-definitions for vhdl-files of a vhdl-project
export type VHDL_Library = string;
export type VHDL_Files = string[];
export type VHDL_ProjectFiles = Map<VHDL_Library, VHDL_Files>;

//Constants for UserData-Folder
const UserDataFolder = "UserData";
const SimulationDataFile = "SimulationData.toml";
const SynthesisDataFile = "SynthesisData.toml";

//Constants for ProjectData-Folder
const ProjectDataFolder = "ProjectData";