import { ISynthesisProject } from "../SynthesisProject";

export interface ISynthesisFactory
{
    CreateProject(name : string, path : string) : ISynthesisProject;
}