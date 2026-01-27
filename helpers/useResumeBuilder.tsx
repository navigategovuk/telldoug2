/**
 * Combined Resume Builder Hook
 * Provides a unified interface for all resume-building functionality
 */

import { useMemo } from "react";
import { useProfile, useUpdateProfile, useWorkExperiences, useEducation, useProfileSkills, useProfileProjects,
  useCreateWorkExperience, useUpdateWorkExperience, useDeleteWorkExperience,
  useCreateEducation, useUpdateEducation, useDeleteEducation,
  useCreateProfileSkill, useUpdateProfileSkill, useDeleteProfileSkill,
  useCreateProfileProject, useUpdateProfileProject, useDeleteProfileProject,
} from "./useProfileApi";
import { useVariants, useVariant, useCreateVariant, useUpdateVariant, useDeleteVariant, useDuplicateVariant, useSetPrimaryVariant } from "./useVariantsApi";
import { useSnapshots, useCreateSnapshot, useDeleteSnapshot, useRestoreSnapshot } from "./useSnapshotsApi";
import { useExportPreview, useDownloadExport } from "./useExportApi";
import { useShareLinkManager } from "./useShareApi";

interface UseResumeBuilderOptions {
  profileId?: string;
  variantId?: string;
  autoLoad?: boolean;
}

export function useResumeBuilder(options: UseResumeBuilderOptions = {}) {
  const { profileId, variantId, autoLoad = true } = options;

  // Profile data
  const profileQuery = useProfile(profileId, { enabled: autoLoad });
  const workQuery = useWorkExperiences({ profileId }, { enabled: autoLoad && !!profileId });
  const educationQuery = useEducation({ profileId }, { enabled: autoLoad && !!profileId });
  const skillsQuery = useProfileSkills({ profileId }, { enabled: autoLoad && !!profileId });
  const projectsQuery = useProfileProjects({ profileId }, { enabled: autoLoad && !!profileId });

  // Profile mutations
  const updateProfile = useUpdateProfile();
  const createWork = useCreateWorkExperience();
  const updateWork = useUpdateWorkExperience();
  const deleteWork = useDeleteWorkExperience();
  const createEducation = useCreateEducation();
  const updateEducation = useUpdateEducation();
  const deleteEducation = useDeleteEducation();
  const createSkill = useCreateProfileSkill();
  const updateSkill = useUpdateProfileSkill();
  const deleteSkill = useDeleteProfileSkill();
  const createProject = useCreateProfileProject();
  const updateProject = useUpdateProfileProject();
  const deleteProject = useDeleteProfileProject();

  // Variants
  const variantsQuery = useVariants({ profileId }, { enabled: autoLoad && !!profileId });
  const currentVariantQuery = useVariant({ id: variantId || "" }, { enabled: !!variantId });
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();
  const duplicateVariant = useDuplicateVariant();
  const setPrimaryVariant = useSetPrimaryVariant();

  // Snapshots
  const snapshotsQuery = useSnapshots({ resumeVariantId: variantId || "" }, { enabled: !!variantId });
  const createSnapshot = useCreateSnapshot();
  const deleteSnapshot = useDeleteSnapshot();
  const restoreSnapshot = useRestoreSnapshot();

  // Export
  const previewQuery = useExportPreview(
    { variantId: variantId || "", format: "html" },
    { enabled: !!variantId }
  );
  const downloadExport = useDownloadExport();

  // Sharing
  const shareManager = useShareLinkManager(variantId);

  // Computed state
  const isLoading = useMemo(() => (
    profileQuery.isLoading || workQuery.isLoading || educationQuery.isLoading ||
    skillsQuery.isLoading || projectsQuery.isLoading || variantsQuery.isLoading
  ), [profileQuery.isLoading, workQuery.isLoading, educationQuery.isLoading,
      skillsQuery.isLoading, projectsQuery.isLoading, variantsQuery.isLoading]);

  const hasChanges = useMemo(() => (
    updateProfile.isPending || createWork.isPending || updateWork.isPending || deleteWork.isPending ||
    createEducation.isPending || updateEducation.isPending || deleteEducation.isPending ||
    createSkill.isPending || updateSkill.isPending || deleteSkill.isPending ||
    createProject.isPending || updateProject.isPending || deleteProject.isPending ||
    createVariant.isPending || updateVariant.isPending || deleteVariant.isPending
  ), [updateProfile.isPending, createWork.isPending, updateWork.isPending, deleteWork.isPending,
      createEducation.isPending, updateEducation.isPending, deleteEducation.isPending,
      createSkill.isPending, updateSkill.isPending, deleteSkill.isPending,
      createProject.isPending, updateProject.isPending, deleteProject.isPending,
      createVariant.isPending, updateVariant.isPending, deleteVariant.isPending]);

  const primaryVariant = useMemo(() => 
    variantsQuery.data?.variants.find(v => v.isPrimary),
    [variantsQuery.data?.variants]
  );

  return {
    // Profile data
    profile: profileQuery.data?.profile,
    workExperiences: workQuery.data?.work ?? [],
    education: educationQuery.data?.education ?? [],
    skills: skillsQuery.data?.skills ?? [],
    projects: projectsQuery.data?.projects ?? [],
    
    // Variants
    variants: variantsQuery.data?.variants ?? [],
    currentVariant: currentVariantQuery.data?.variant,
    primaryVariant,
    
    // Snapshots
    snapshots: snapshotsQuery.data?.snapshots ?? [],
    
    // Preview
    previewHtml: previewQuery.data?.html,
    
    // Sharing
    shareLinks: shareManager.shareLinks,
    
    // State
    isLoading,
    hasChanges,
    
    // Profile actions
    updateProfile: updateProfile.mutate,
    
    // Work actions
    addWorkExperience: createWork.mutate,
    updateWorkExperience: updateWork.mutate,
    removeWorkExperience: deleteWork.mutate,
    
    // Education actions
    addEducation: createEducation.mutate,
    updateEducation: updateEducation.mutate,
    removeEducation: deleteEducation.mutate,
    
    // Skills actions
    addSkill: createSkill.mutate,
    updateSkill: updateSkill.mutate,
    removeSkill: deleteSkill.mutate,
    
    // Project actions
    addProject: createProject.mutate,
    updateProject: updateProject.mutate,
    removeProject: deleteProject.mutate,
    
    // Variant actions
    createVariant: createVariant.mutate,
    updateVariant: updateVariant.mutate,
    deleteVariant: deleteVariant.mutate,
    duplicateVariant: duplicateVariant.mutate,
    setPrimaryVariant: setPrimaryVariant.mutate,
    
    // Snapshot actions
    createSnapshot: createSnapshot.mutate,
    deleteSnapshot: deleteSnapshot.mutate,
    restoreSnapshot: restoreSnapshot.mutate,
    
    // Export actions
    downloadExport: downloadExport.download,
    
    // Share actions
    createShareLink: shareManager.createShareLink,
    createShareLinkAndCopy: shareManager.createAndCopy,
    revokeShareLink: shareManager.revokeShareLink,
    deleteShareLink: shareManager.deleteShareLink,
    copyShareLink: shareManager.copyToClipboard,

    // Raw queries for advanced usage
    queries: {
      profile: profileQuery,
      work: workQuery,
      education: educationQuery,
      skills: skillsQuery,
      projects: projectsQuery,
      variants: variantsQuery,
      currentVariant: currentVariantQuery,
      snapshots: snapshotsQuery,
      preview: previewQuery,
    },
  };
}

export type ResumeBuilderState = ReturnType<typeof useResumeBuilder>;
