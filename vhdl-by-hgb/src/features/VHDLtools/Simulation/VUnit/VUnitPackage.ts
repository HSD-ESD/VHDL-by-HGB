

export interface VUnitExportData {
    export_format_version: {
        major: number;
        minor: number;
        patch: number;
    };
    files: VUnitFile[];
    tests: VUnitTest[];
    [propName: string]: any;
}

interface VUnitTest {
    attributes: {};
    location: {
        file_name: string;
        length: number;
        offset: number;
    };
    name: string;
    [propName: string]: any;
}

interface VUnitFile {
    file_name: string;
    library_name: string;
    [propName: string]: any;
}

