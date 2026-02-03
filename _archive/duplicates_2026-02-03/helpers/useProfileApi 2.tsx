/**
 * React Query hooks for Profile API
 * Includes: basic profile info, work experience, education, skills, projects
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getProfile, OutputType as ProfileOutput, InputType as ProfileInput } from "../endpoints/profile/get_GET.schema";
import { updateProfileBasics, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/profile/updateBasics_POST.schema";

// Work Experience
import {
  listWork, createWork, updateWork, deleteWork,
  ListInputType as WorkListInput, ListOutputType as WorkListOutput,
  CreateInputType as WorkCreateInput, CreateOutputType as WorkCreateOutput,
  UpdateInputType as WorkUpdateInput, UpdateOutputType as WorkUpdateOutput,
  DeleteInputType as WorkDeleteInput, DeleteOutputType as WorkDeleteOutput,
} from "../endpoints/profile/work.schema";

// Education
import {
  listEducation, createEducation, updateEducation, deleteEducation,
  ListInputType as EduListInput, ListOutputType as EduListOutput,
  CreateInputType as EduCreateInput, CreateOutputType as EduCreateOutput,
  UpdateInputType as EduUpdateInput, UpdateOutputType as EduUpdateOutput,
  DeleteInputType as EduDeleteInput, DeleteOutputType as EduDeleteOutput,
} from "../endpoints/profile/education.schema";

// Skills
import {
  listSkills, createSkill, updateSkill, deleteSkill,
  ListInputType as SkillListInput, ListOutputType as SkillListOutput,
  CreateInputType as SkillCreateInput, CreateOutputType as SkillCreateOutput,
  UpdateInputType as SkillUpdateInput, UpdateOutputType as SkillUpdateOutput,
  DeleteInputType as SkillDeleteInput, DeleteOutputType as SkillDeleteOutput,
} from "../endpoints/profile/skills.schema";

// Projects
import {
  listProjects, createProject, updateProject, deleteProject,
  ListInputType as ProjectListInput, ListOutputType as ProjectListOutput,
  CreateInputType as ProjectCreateInput, CreateOutputType as ProjectCreateOutput,
  UpdateInputType as ProjectUpdateInput, UpdateOutputType as ProjectUpdateOutput,
  DeleteInputType as ProjectDeleteInput, DeleteOutputType as ProjectDeleteOutput,
} from "../endpoints/profile/projects.schema";

// Query keys
export const PROFILE_QUERY_KEY = ["profile"];
export const WORK_QUERY_KEY = ["profile", "work"];
export const EDUCATION_QUERY_KEY = ["profile", "education"];
export const PROFILE_SKILLS_QUERY_KEY = ["profile", "skills"];
export const PROFILE_PROJECTS_QUERY_KEY = ["profile", "projects"];

// Profile Basics
export function useProfile(profileId?: string, options?: Omit<UseQueryOptions<ProfileOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...PROFILE_QUERY_KEY, profileId],
    queryFn: () => getProfile({ profileId }),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateProfileBasics(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...PROFILE_QUERY_KEY, variables.profileId] });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}

// Work Experience
export function useWorkExperiences(input: WorkListInput = {}, options?: Omit<UseQueryOptions<WorkListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...WORK_QUERY_KEY, input],
    queryFn: () => listWork(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateWorkExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkCreateInput) => createWork(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_QUERY_KEY });
    },
  });
}

export function useUpdateWorkExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkUpdateInput) => updateWork(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_QUERY_KEY });
    },
  });
}

export function useDeleteWorkExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkDeleteInput) => deleteWork(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_QUERY_KEY });
    },
  });
}

// Education
export function useEducation(input: EduListInput = {}, options?: Omit<UseQueryOptions<EduListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...EDUCATION_QUERY_KEY, input],
    queryFn: () => listEducation(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EduCreateInput) => createEducation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDUCATION_QUERY_KEY });
    },
  });
}

export function useUpdateEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EduUpdateInput) => updateEducation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDUCATION_QUERY_KEY });
    },
  });
}

export function useDeleteEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EduDeleteInput) => deleteEducation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDUCATION_QUERY_KEY });
    },
  });
}

// Skills
export function useProfileSkills(input: SkillListInput = {}, options?: Omit<UseQueryOptions<SkillListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...PROFILE_SKILLS_QUERY_KEY, input],
    queryFn: () => listSkills(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateProfileSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SkillCreateInput) => createSkill(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_SKILLS_QUERY_KEY });
    },
  });
}

export function useUpdateProfileSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SkillUpdateInput) => updateSkill(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_SKILLS_QUERY_KEY });
    },
  });
}

export function useDeleteProfileSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SkillDeleteInput) => deleteSkill(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_SKILLS_QUERY_KEY });
    },
  });
}

// Projects
export function useProfileProjects(input: ProjectListInput = {}, options?: Omit<UseQueryOptions<ProjectListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...PROFILE_PROJECTS_QUERY_KEY, input],
    queryFn: () => listProjects(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateProfileProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectCreateInput) => createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_PROJECTS_QUERY_KEY });
    },
  });
}

export function useUpdateProfileProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectUpdateInput) => updateProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_PROJECTS_QUERY_KEY });
    },
  });
}

export function useDeleteProfileProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectDeleteInput) => deleteProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_PROJECTS_QUERY_KEY });
    },
  });
}
