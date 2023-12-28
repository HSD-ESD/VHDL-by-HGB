
import exp = require("constants");
import { VhdlEntity } from "../../VhdlPackage";

//folder for scripts
export const CustomDiamondTclScriptsFolder : string = "TclScriptsHGB";

export enum CustomDiamondTclScript {
    GenerateProject = "Generate.tcl",
    UpdateFiles = "UpdateFiles.tcl",
    LaunchGUI = "LaunchGUI.tcl",
    Compile = "Compile.tcl",
    TopLevel = "TopLevel.tcl",
    Device = "Device.tcl",
    Family = "Family.tcl",
}

export class DiamondLdf {
    public Path: string;
    public TopLevel: VhdlEntity;
    public Family: string;
    public Device: string;
    public VhdlFiles: string[];
  
    public constructor(path : string) {
      this.Path = path;
      this.TopLevel = { mName: "", mPath: "" };
      this.Family = "";
      this.Device = "";
      this.VhdlFiles = [];
    }
}

export const DiamondCommand = {
    prj : "prj",    // Project Manager extended Tcl commands.
    sys : "sys",    // System information Tcl commands.
    ncd : "ncd",    // NCD extended Tcl commands.
    ngd : "ngd",    // NGD extended Tcl commands.
    rvl : "rvl",    // Reveal Inserter extended Tcl commands.
    sbp : "sbp",    // System builder planner extended Tcl commands.
    rva : "rva",    // Reveal Analyzer extended Tcl commands.
    pwc : "pwc",    // Power Calculator extended Tcl commands.
    pgr : "pgr",    // Programmer extended Tcl commands.
    psb : "psb",    // Pojo2 extended Tcl commands.
    icf : "icf",    // Incremental Design Flow Database extended Tcl commands.
    cmp : "cmp",    // Compile Lattice FPGA simulation libraries.
    eco : "eco",    // Physical Design extended Tcl commands.
};

export const DiamondProjectCommand = {
    prj_project : `${DiamondCommand.prj}_project`,  // Project commands to manipulate project
    prj_src : `${DiamondCommand.prj}_src`,          // Project source commands to manipulate project sources
    prj_impl : `${DiamondCommand.prj}_impl`,        // Project implementation commands to manipulate implementation
    prj_strgy : `${DiamondCommand.prj}_strgy`,      // Project strategy commands to manipulate strategies
    prj_run : `${DiamondCommand.prj}_run`,          // Project flow running command to run a flow process
    prj_syn : `${DiamondCommand.prj}_syn`,          // Project synthesis tool commands to list or set synthesis tool
    prj_dev : `${DiamondCommand.prj}_dev`,          // Project device commands to list or set the device used in the project
    prj_incr : `${DiamondCommand.prj}_incr`,        // Project incremental flow commands to list or set the incremental flow
};


export const DiamondProjectManipulationCommand = {
    new : `${DiamondProjectCommand.prj_project} new`,     // Create a new project
        // Usage:
        // prj_project new -name <project name> [-dev <device name>] [-asc_num <asc number>]
        //                 [-lpf <lpf file name>] [-impl <initial implementation name>]
        //                 [impl_dir <initial implementation directory>] [-synthesis <synthesis tool name>]
    open : `${DiamondProjectCommand.prj_project} open`,   // Open a project file
        // Usage:
        //     prj_project open <project file>
    close : `${DiamondProjectCommand.prj_project} close`, // Close the current project
        // Usage:
        //     prj_project close
    save : `${DiamondProjectCommand.prj_project} save`,   // Save the current project
        // Usage:
        //     prj_project save [project file]
    saveas : `${DiamondProjectCommand.prj_project} saveas`, // Save the current project as a new project with specified name and directory and change current workaround to the new project
        // Usage:
        //     prj_project saveas -name <new project name> -dir <new project directory> [-copy_gen]
        
    option : `${DiamondProjectCommand.prj_project} option`, // List, set or remove a project option
        // Usage:
        //     prj_project option
        //             : List all the options in the current project
        //     prj_project option <option name> [option value list]
        //             : List or set the option value
        //     prj_project option -append <option name> <option value>
        //             : Append a value to the specified option value
        //     prj_project option -rem <option name>...
        //             : Remove the options of the current project
    archive : `${DiamondProjectCommand.prj_project} archive`, // Archive the current project
        // Usage:
        //     prj_project archive [-includeAll] <archive_file>
        //             : Archive the current project into the archive_file
        //     prj_project archive -extract -dir <destination directory> <archive_file>
        //             : Extract the archive file and load the project
};

export const DiamondProjectSourceCommand = {
    add : `${DiamondProjectCommand.prj_src} add`, // Add sources to the current project
        // Usage:
        //     prj_src add [-impl <implement name>] [-format <VHDL|VERILOG|EDIF|SCHEMATIC|...>]
        //                 [-simulate_only|-synthesis_only]
        //                 [-include <path list for Verilog include search path>]
        //                 [-work <VHDL lib name>] [[-opt <name=value>] ...] [-exclude]
        //                 <src file>...
    remove : `${DiamondProjectCommand.prj_src} remove`, // Remove design source from the current project
        // Usage:
        //     prj_src remove [-impl <implement name>] -all
        //             : Remove all the design sources in project
        //     prj_src remove [-impl <implement name>] <src  file> ...
        //             : Remove the specified sources from the current project
    exclude : `${DiamondProjectCommand.prj_src} exclude`, // Exclude the design sources from the current project
        // Usage:
        //     prj_src exclude [-impl <implement name>] <src  file>
    enable : `${DiamondProjectCommand.prj_src} enable`, // Enable the excluded design sources from the current project
        // Usage:
        //     prj_src enable [-impl <implement name>] <src  file> ...
    syn_sim : `${DiamondProjectCommand.prj_src} syn_sim`, // Return or change the setting of a design HDL source as a synthesis or simulation source
        // Usage:
        //     prj_src syn_sim [-impl <implement name>] -src <source name>
        //                     [SimulateOnly|SynthesisOnly|SynthesisAndSimulate]
    option : `${DiamondProjectCommand.prj_src} option`, // List, set or remove a source option
        // Usage:
        //     prj_src option -src <source name> [-impl <implement name>]
        //             : List all the options in the specified source
        //     prj_src option -src <source name> [-impl <implement name>]
        //                    <option name> [option value list]
        //             : List or set the source's option value
        //     prj_src option -src <source name> [-impl <implement name>]
};

export const DiamondProjectImplementationCommand = {
    new : `${DiamondProjectCommand.prj_impl} new`, // Create a new implementation in the current project
        // Usage:
        //     prj_impl new <new impl name> [-dir <implementation directory>]
        //                  [-lpf <lpf file name>] [-strategy <default strategy name>] [-synthesis <synthesis tool name>]
    delete : `${DiamondProjectCommand.prj_impl} delete`, // Delete the specified implementation in the current project
        // Usage:
        //     prj_impl delete <impl name>
    active : `${DiamondProjectCommand.prj_impl} active`, // Activate implementation in the current project
        // Usage:
        //     prj_impl active <impl name>
    path : `${DiamondProjectCommand.prj_impl} path`, // List the implementation's path
        // Usage:
        //     prj_impl path [-impl <implement name>]
    pre_script : `${DiamondProjectCommand.prj_impl} pre_script`, // List or set the implementation's user script before running milestone.
        // Usage:
        //     prj_impl pre_script [-impl <implement name>] <milestone name> <script_file>
        //           : <milestone name> should be "syn", "map", "par", "export"
    post_script : `${DiamondProjectCommand.prj_impl} post_script`, // List or set the implementation's user script after running milestone.
        // Usage:
        //     prj_impl post_script [-impl <implement name>] <milestone name> <script_file>
        //           : <milestone name> should be "syn", "map", "par", "export"
    option : `${DiamondProjectCommand.prj_impl} option`, // List, set or remove implementation options in the current project
        // Usage:
        //     prj_impl option [-impl <implement name>]
        //             : List all the options in the specified implementation
        //     prj_impl option [-impl <implement name>] <option name> [option value list]
        //             : List or set the implementation's option value
        //     prj_impl option [-impl <implement name>] -append <option name> <option value>
        //             : Append a value to the specified option value
        //     prj_impl option [-impl <implement name>] -rem <option name>...
        //             : Remove the the options in the implementation
    cleanup : `${DiamondProjectCommand.prj_impl} cleanup`, // Clean up the implementation result files in the current project
        // Usage:
        //     prj_impl cleanup [-impl <implement name>]
    clone : `${DiamondProjectCommand.prj_impl} clone`, // Clone an existing implementation
};

export const DiamondProjectStrategyCommand = {
    copy : `${DiamondProjectCommand.prj_strgy} copy`, // Create a new strategy by copying from an existing strategy
        // Usage:
        //     prj_strgy copy -from <source strategy name> -name <new strategy name>
        //                    -file <strategy file name>
    new : `${DiamondProjectCommand.prj_strgy} new`, // Create a new strategy with default setting
        // Usage:
        //     prj_strgy new -name <new strategy name> -file <strategy file name>
    import : `${DiamondProjectCommand.prj_strgy} import`, // Import an existing strategy file
        // Usage:
        //     prj_strgy import -name <new strategy name> -file <strategy file name>
    delete : `${DiamondProjectCommand.prj_strgy} delete`, // Delete an existing strategy
        // Usage:
        //     prj_strgy delete <strategy name>
    set : `${DiamondProjectCommand.prj_strgy} set`, // Associate the strategy with the specified implementation
        // Usage:
        //     prj_strgy set [-impl <implementation name>] <strategy name>
    set_value : `${DiamondProjectCommand.prj_strgy} set_value`, // Set value to a strategy item
        // Usage:
        //     prj_strgy set_value [-strategy <strategy name>] <option name=option value> ...
    get_value : `${DiamondProjectCommand.prj_strgy} get_value`, // Get value of a strategy item
        // Usage:
        //     prj_strgy get_value [-strategy <strategy name>] <option name>
    list_value : `${DiamondProjectCommand.prj_strgy} list_value`, // List value of strategy items
        // Usage:
        //     prj_strgy list_value [-strategy <strategy name>] <pattern>
    list_option : `${DiamondProjectCommand.prj_strgy} list_option`, // List strategy option help
        // Usage:
        //     prj_strgy list_option <pattern>
};

export const DiamondProjectRunCommand = {
    run : `${DiamondProjectCommand.prj_run}`, // Run a milestone or task
        // Usage:
        //     prj_run <milestone name> [-impl <implement name>] [-task <task name>]
        //             [-forceAll|forceOne]
};

export const DiamondProjectSynthesisCommand = {
    list : `${DiamondProjectCommand.prj_syn}`, // List the synthesis tool
        // Usage:
        //     prj_syn 
        //             : List the synthesis tool used in active implementation
    set : `${DiamondProjectCommand.prj_syn} set`, // Set the synthesis tool
        //     prj_syn set <synthesis tool> [-impl <implementation name>]
        //             : Set the synthesis tool for specified implementation
        //               Synthesis tool could be 'lse', 'synplify' or 'precision'.
};

export const DiamondProjectDeviceCommand = {
    list : `${DiamondProjectCommand.prj_dev}`, // List the device
        // Usage:
        //     prj_dev [-family|-device|-package|-performance|-operation|-part|-asc]
        //             : List the device information of the current project in family, 
        //               device, package, performance, operation, part, ASC sequence Tcl list
    set : `${DiamondProjectCommand.prj_dev} set`, // Set the device   
        //     prj_dev set [-family <family name>] [-device <device name>] 
        //                 [-package <package name>] [-performance <performance grade>] 
        //                 [-operation <operation>] [-part <part name>] [-asc_num <asc number>]
        //             : Change the device to the specified family, device, package, performance,
        //               operation, part or ASC
};

export const DiamondProjectIncrementalCommand = {
    enable : `${DiamondProjectCommand.prj_incr} enable`, // Get or set the incremental design flow mode
        // Usage:
        //     prj_incr set [-enable|-disable] [-impl <implementation name>]
    restore : `${DiamondProjectCommand.prj_incr} restore`, // Set the previous or golden backup as the reference for the next incremental run
        // Usage:
        //     prj_incr restore [-impl <implementation name>] <previous|golden>
    backup_golden : `${DiamondProjectCommand.prj_incr} backup_golden`, // Set the current successful results as the golden reference backup
        // Usage:
        //     prj_incr backup_golden [-impl <implementation name>]
};
