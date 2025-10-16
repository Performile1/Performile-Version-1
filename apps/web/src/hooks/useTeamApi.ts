import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  TeamMember, 
  InviteTeamMemberRequest, 
  UserEntities,
  TeamRole 
} from '@/types/team';
import { apiClient } from '@/services/apiClient';

// Query keys
export const teamKeys = {
  all: ['team'] as const,
  courierMembers: (courierId: string) => [...teamKeys.all, 'courier', courierId, 'members'] as const,
  storeMembers: (storeId: string) => [...teamKeys.all, 'store', storeId, 'members'] as const,
  userEntities: () => [...teamKeys.all, 'user-entities'] as const,
};

// Get courier team members
export const useCourierTeamMembers = (courierId: string) => {
  return useQuery({
    queryKey: teamKeys.courierMembers(courierId),
    queryFn: async (): Promise<TeamMember[]> => {
      const response = await apiClient.get(`/team/couriers/${courierId}/members`);
      return response.data.data;
    },
    enabled: !!courierId,
  });
};

// Get store team members
export const useStoreTeamMembers = (storeId: string) => {
  return useQuery({
    queryKey: teamKeys.storeMembers(storeId),
    queryFn: async (): Promise<TeamMember[]> => {
      const response = await apiClient.get(`/team/stores/${storeId}/members`);
      return response.data.data;
    },
    enabled: !!storeId,
  });
};

// Get user's accessible entities
export const useUserEntities = () => {
  return useQuery({
    queryKey: teamKeys.userEntities(),
    queryFn: async (): Promise<UserEntities> => {
      const response = await apiClient.get('/team/my-entities');
      return response.data.data;
    },
  });
};

// Invite member to courier team
export const useInviteToCourierTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courierId, ...data }: InviteTeamMemberRequest & { courierId: string }) => {
      const response = await apiClient.post(`/team/couriers/${courierId}/invite`, data);
      return response.data;
    },
    onSuccess: (_: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.courierMembers(variables.courierId) });
      toast.success('Team invitation sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    },
  });
};

// Invite member to store team
export const useInviteToStoreTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, ...data }: InviteTeamMemberRequest & { storeId: string }) => {
      const response = await apiClient.post(`/team/stores/${storeId}/invite`, data);
      return response.data;
    },
    onSuccess: (_: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.storeMembers(variables.storeId) });
      toast.success('Team invitation sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    },
  });
};

// Accept invitation
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await apiClient.post(`/team/invitations/${token}/accept`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all team-related queries since we don't know which entity was joined
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      queryClient.invalidateQueries({ queryKey: teamKeys.userEntities() });
      toast.success('Successfully joined the team!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    },
  });
};

// Update team member role
export const useUpdateTeamMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      teamMemberId, 
      teamRole
    }: { 
      teamMemberId: string; 
      teamRole: TeamRole;
    }) => {
      const response = await apiClient.put(`/team/members/${teamMemberId}/role`, {
        teamRole
      });
      return response.data;
    },
    onSuccess: (_: any, variables: any) => {
      // Invalidate the appropriate team members query
      if (variables.entityType === 'courier') {
        queryClient.invalidateQueries({ queryKey: teamKeys.courierMembers(variables.entityId) });
      } else {
        queryClient.invalidateQueries({ queryKey: teamKeys.storeMembers(variables.entityId) });
      }
      toast.success('Team member role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update member role');
    },
  });
};

// Remove team member
export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      teamMemberId
    }: { 
      teamMemberId: string;
    }) => {
      const response = await apiClient.delete(`/team/members/${teamMemberId}`);
      return response.data;
    },
    onSuccess: (_: any, variables: any) => {
      // Invalidate the appropriate team members query
      if (variables.entityType === 'courier') {
        queryClient.invalidateQueries({ queryKey: teamKeys.courierMembers(variables.entityId) });
      } else {
        queryClient.invalidateQueries({ queryKey: teamKeys.storeMembers(variables.entityId) });
      }
      queryClient.invalidateQueries({ queryKey: teamKeys.userEntities() });
      toast.success('Team member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove team member');
    },
  });
};
