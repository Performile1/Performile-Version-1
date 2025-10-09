import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  SelectChangeEvent,
} from '@mui/material';
import {
  Delete,
  Edit,
  FileDownload,
  Close,
} from '@mui/icons-material';

interface BulkActionsBarProps {
  selectedCount: number;
  onUpdateStatus: (status: string) => void;
  onExport: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onUpdateStatus,
  onExport,
  onDelete,
  onClear,
}) => {
  const [newStatus, setNewStatus] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleStatusChange = (event: SelectChangeEvent) => {
    const status = event.target.value;
    setNewStatus(status);
    if (status) {
      onUpdateStatus(status);
      setNewStatus('');
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          minWidth: 600,
          maxWidth: '90vw',
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 'bold', mr: 2 }}>
          {selectedCount} {selectedCount === 1 ? 'order' : 'orders'} selected
        </Typography>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Update Status</InputLabel>
          <Select
            value={newStatus}
            label="Update Status"
            onChange={handleStatusChange}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="picked_up">Picked Up</MenuItem>
            <MenuItem value="in_transit">In Transit</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          onClick={onExport}
        >
          Export
        </Button>

        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={handleDeleteClick}
        >
          Delete
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="text"
          startIcon={<Close />}
          onClick={onClear}
        >
          Clear Selection
        </Button>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedCount} {selectedCount === 1 ? 'order' : 'orders'}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
