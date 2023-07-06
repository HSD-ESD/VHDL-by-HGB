
export interface HDLRegressionData 
{
    files: HDLRegressionFile[];
    tests: HDLRegressionTest[];
    [propName: string]: any;
}

export interface HDLRegressionTest 
{
    testcase_id: number;
    testbench: string;
    architecture: string;
    name: string;
}

export interface HDLRegressionFile 
{
    file_name: string;
    library_name: string;
    is_testbench : boolean;
    [propName: string]: any;
}