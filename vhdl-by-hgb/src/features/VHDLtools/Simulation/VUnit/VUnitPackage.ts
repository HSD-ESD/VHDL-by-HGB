

export interface VunitExportData {
    export_format_version: {
        major: number;
        minor: number;
        patch: number;
    };
    files: VunitFile[];
    tests: VunitTest[];
    [propName: string]: any;
}

interface VunitTest {
    attributes: {};
    location: {
        file_name: string;
        length: number;
        offset: number;
    };
    name: string;
    [propName: string]: any;
}

interface VunitFile {
    file_name: string;
    library_name: string;
    [propName: string]: any;
}

