import { ISynthesisProject } from "../SynthesisProject";

export interface SynthesisFactory
{
    CreateProject() : ISynthesisProject;
}