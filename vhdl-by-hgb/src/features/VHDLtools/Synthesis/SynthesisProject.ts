
export interface ISynthesisProject 
{
    GenerateProject() : boolean;

    UpdateFiles() : boolean;

    LaunchGUI() : void;

    Compile() : boolean;

}