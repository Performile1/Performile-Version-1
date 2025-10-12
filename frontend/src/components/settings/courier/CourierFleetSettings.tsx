import React from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { LocalShipping, Add } from '@mui/icons-material';

interface CourierFleetSettingsProps {
  subscriptionInfo?: any;
}

export const CourierFleetSettings: React.FC<CourierFleetSettingsProps> = ({ subscriptionInfo }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalShipping /> Fleet Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your delivery vehicles and fleet information
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Vehicles</Typography>
          <Button variant="contained" startIcon={<Add />}>
            Add Vehicle
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>License Plate</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">No vehicles added yet</Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
