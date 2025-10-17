import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon,
  Store as MerchantIcon,
  LocalShipping as CourierIcon,
  Person as UserIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { toast } from 'react-hot-toast';

interface User {
  user_id: string;
  email: string;
  full_name: string;
  user_role: string;
  created_at: string;
  last_login: string;
}

const roleConfig = {
  admin: { label: 'Admin', icon: AdminIcon, color: 'error' as const },
  merchant: { label: 'Merchant', icon: MerchantIcon, color: 'primary' as const },
  courier: { label: 'Courier', icon: CourierIcon, color: 'success' as const },
  user: { label: 'User', icon: UserIcon, color: 'default' as const },
};

export const RoleManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [newRole, setNewRole] = useState('');

  const queryClient = useQueryClient();

  // Fetch users
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', page, rowsPerPage, searchQuery, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: rowsPerPage.toString(),
        offset: (page * rowsPerPage).toString(),
      });
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter !== 'all') params.append('role', roleFilter);

      const response = await apiClient.get(`/admin/users?${params}`);
      return response.data.data;
    },
  });

  const users = data?.users || [];
  const totalUsers = data?.total || 0;

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiClient.put(`/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role updated successfully');
      setEditDialog({ open: false, user: null });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    },
  });

  const handleEditRole = (user: User) => {
    setEditDialog({ open: true, user });
    setNewRole(user.user_role);
  };

  const handleSaveRole = () => {
    if (editDialog.user && newRole) {
      updateRoleMutation.mutate({
        userId: editDialog.user.user_id,
        role: newRole,
      });
    }
  };

  const getRoleIcon = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    const Icon = config.icon;
    return <Icon fontSize="small" />;
  };

  const getRoleChip = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={getRoleIcon(role)}
      />
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load users. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        👥 Role Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage user roles and permissions
      </Typography>

      <Card>
        <CardContent>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="merchant">Merchant</MenuItem>
              <MenuItem value="courier">Courier</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
          </Box>

          {/* Users Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user: User) => (
                  <TableRow key={user.user_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {user.full_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleChip(user.user_role)}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditRole(user)}
                      >
                        Change Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={totalUsers}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, user: null })}>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          {editDialog.user && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                User: <strong>{editDialog.user.full_name || editDialog.user.email}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Role: {getRoleChip(editDialog.user.user_role)}
              </Typography>

              <Select
                fullWidth
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                sx={{ mt: 2 }}
              >
                <MenuItem value="admin">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AdminIcon fontSize="small" />
                    Admin - Full system access
                  </Box>
                </MenuItem>
                <MenuItem value="merchant">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MerchantIcon fontSize="small" />
                    Merchant - Store management
                  </Box>
                </MenuItem>
                <MenuItem value="courier">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CourierIcon fontSize="small" />
                    Courier - Delivery management
                  </Box>
                </MenuItem>
                <MenuItem value="user">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UserIcon fontSize="small" />
                    User - Basic access
                  </Box>
                </MenuItem>
              </Select>

              <Alert severity="warning" sx={{ mt: 2 }}>
                Changing a user's role will immediately affect their access permissions.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRole}
            disabled={updateRoleMutation.isPending || newRole === editDialog.user?.user_role}
          >
            {updateRoleMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;
