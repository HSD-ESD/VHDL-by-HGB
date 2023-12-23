

export namespace VHDL_LS 
{
    export const VHDL_LS_FILE = "vhdl_ls.toml";

    export enum third_party_libraries {
        VUnit = "vunit_lib",
        OSVVM = "osvvm",
        UVVM = "uvvm",
        Bitvis = "bitvis",
        PoC = "PoC",
        NEORV = "neorv",
    }

    export function is_third_party_library(libraryName : string) : boolean
    {
        const third_party_libs = Object.values(VHDL_LS.third_party_libraries) as string[];

        for (const third_party_lib of third_party_libs)
        {
            if (libraryName.includes(third_party_lib))
            {
                return true;
            }
        }

        return false;
    }

}

