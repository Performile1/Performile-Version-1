import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Skeleton
} from '@mui/material';
import { TeamMembersList } from '@/components/team/TeamMembersList';
import { InviteMemberDialog } from '@/components/team/InviteMemberDialog';
import { 
  useCourierTeamMembers, 
  useStoreTeamMembers,
  useInviteToCourierTeam,
  useInviteToStoreTeam,
  useUpdateTeamMemberRole,
  useRemoveTeamMember,
  useUserEntities
} from '@/hooks/useTeamApi';
import { TeamRole } from '@/types/team';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const TeamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'courier' | 'store';
    id: string;
    name: string;
    role: TeamRole;
  } | null>(null);

  // Get user's accessible entities
  const { data: userEntities, isLoading: entitiesLoading } = useUserEntities();

  // Get team members for selected entities
  const courierEntity = userEntities?.couriers[0];
  const storeEntity = userEntities?.stores[0];

  const { data: courierMembers, isLoading: courierMembersLoading } = useCourierTeamMembers(
    courierEntity?.courier_id || ''
  );
  const { data: storeMembers, isLoading: storeMembersLoading } = useStoreTeamMembers(
    storeEntity?.store_id || ''
  );

  // Mutations
  const inviteToCourierMutation = useInviteToCourierTeam();
  const inviteToStoreMutation = useInviteToStoreTeam();
  const updateMemberRoleMutation = useUpdateTeamMemberRole();
  const removeMemberMutation = useRemoveTeamMember();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInviteMember = (entityType: 'courier' | 'store', entityId: string, entityName: string, userRole: TeamRole) => {
    setSelectedEntity({ type: entityType, id: entityId, name: entityName, role: userRole });
    setInviteDialogOpen(true);
  };

  const handleSendInvitation = async (email: string, role: TeamRole) => {
    if (!selectedEntity) return;

    if (selectedEntity.type === 'courier') {
      await inviteToCourierMutation.mutateAsync({
        courierId: selectedEntity.id,
        email,
        teamRole: role
      });
    } else {
      await inviteToStoreMutation.mutateAsync({
        storeId: selectedEntity.id,
        email,
        teamRole: role
      });
    }
  };

  const handleUpdateMemberRole = (memberId: string, newRole: TeamRole) => {
    if (!selectedEntity) return;

    updateMemberRoleMutation.mutate({
      teamMemberId: memberId,
      teamRole: newRole,
      // Remove entityType as it's not part of the expected type
    });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!selectedEntity) return;

    removeMemberMutation.mutate({
      teamMemberId: memberId
      // Remove entityType and entityId as they're not part of the expected type
    });
  };

  if (entitiesLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="rectangular" width="100%" height={400} sx={{ mt: 2 }} />
        </Box>
      </Container>
    );
  }

  if (!userEntities || (userEntities.couriers.length === 0 && userEntities.stores.length === 0)) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Team Management
          </Typography>
          <Alert severity="info">
            You don't have access to any courier companies or stores. 
            Contact your administrator to get access or create a new entity.
          </Alert>
        </Box>
      </Container>
    );
  }

  const availableTabs: Array<{
    type: 'courier' | 'store';
    entities: any[];
  }> = [];
  if (userEntities.couriers.length > 0) {
    availableTabs.push({ type: 'courier' as const, entities: userEntities.couriers });
  }
  if (userEntities.stores.length > 0) {
    availableTabs.push({ type: 'store' as const, entities: userEntities.stores });
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Team Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage team members for your courier companies and stores. Invite new members, 
          assign roles, and control access permissions.
        </Typography>

        <Card>
          <CardContent>
            <Tabs value={activeTab} onChange={handleTabChange}>
              {availableTabs.map((tab, index) => (
                <Tab 
                  key={index}
                  label={`${tab.type === 'courier' ? 'Courier Companies' : 'Stores'} (${tab.entities.length})`}
                />
              ))}
            </Tabs>

            {availableTabs.map((tab, tabIndex) => (
              <TabPanel key={tabIndex} value={activeTab} index={tabIndex}>
                {tab.entities.map((entity: any, entityIndex: number) => {
                  const isCurrentEntity = 
                    (tab.type === 'courier' && entity.courier_id === courierEntity?.courier_id) ||
                    (tab.type === 'store' && entity.store_id === storeEntity?.store_id);

                  if (!isCurrentEntity) return null;

                  const members = tab.type === 'courier' ? courierMembers : storeMembers;
                  const loading = tab.type === 'courier' ? courierMembersLoading : storeMembersLoading;

                  return (
                    <Box key={entityIndex} sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        {tab.type === 'courier' ? entity.courier_name : entity.store_name}
                      </Typography>
                      
                      <TeamMembersList
                        members={members || []}
                        currentUserRole={entity.team_role}
                        entityType={tab.type}
                        onInviteMember={() => handleInviteMember(
                          tab.type,
                          tab.type === 'courier' ? entity.courier_id! : entity.store_id!,
                          tab.type === 'courier' ? entity.courier_name! : entity.store_name!,
                          entity.team_role
                        )}
                        onUpdateMember={(memberId, role) => {
                          setSelectedEntity({
                            type: tab.type,
                            id: tab.type === 'courier' ? entity.courier_id! : entity.store_id!,
                            name: tab.type === 'courier' ? entity.courier_name! : entity.store_name!,
                            role: entity.team_role
                          });
                          handleUpdateMemberRole(memberId, role);
                        }}
                        onRemoveMember={(memberId) => {
                          setSelectedEntity({
                            type: tab.type,
                            id: tab.type === 'courier' ? entity.courier_id! : entity.store_id!,
                            name: tab.type === 'courier' ? entity.courier_name! : entity.store_name!,
                            role: entity.team_role
                          });
                          handleRemoveMember(memberId);
                        }}
                        loading={loading}
                      />
                    </Box>
                  );
                })}
              </TabPanel>
            ))}
          </CardContent>
        </Card>

        <InviteMemberDialog
          open={inviteDialogOpen}
          onClose={() => {
            setInviteDialogOpen(false);
            setSelectedEntity(null);
          }}
          onInvite={handleSendInvitation}
          entityType={selectedEntity?.type || 'courier'}
          loading={inviteToCourierMutation.isPending || inviteToStoreMutation.isPending}
        />
      </Box>
    </Container>
  );
};
