import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import {
  MoreVert,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string | React.ReactNode;
  sortable?: boolean;
  hiddenOnMobile?: boolean;
  priority?: 'high' | 'medium' | 'low'; // For mobile column prioritization
}

interface Action {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: any) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  disabled?: (row: any) => boolean;
}

interface ResponsiveDataGridProps {
  columns: Column[];
  rows: any[];
  actions?: Action[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  keyField?: string;
  mobileCardTitle?: (row: any) => string;
  mobileCardSubtitle?: (row: any) => string;
  mobileCardAvatar?: (row: any) => React.ReactNode;
  expandableContent?: (row: any) => React.ReactNode;
}

const ResponsiveDataGrid: React.FC<ResponsiveDataGridProps> = ({
  columns,
  rows,
  actions = [],
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  keyField = 'id',
  mobileCardTitle,
  mobileCardSubtitle,
  mobileCardAvatar,
  expandableContent,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, row: any) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleActionItemClick = (action: Action) => {
    if (selectedRow) {
      action.onClick(selectedRow);
    }
    handleActionClose();
  };

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const getVisibleColumns = () => {
    if (isMobile) {
      return columns.filter(col => !col.hiddenOnMobile);
    }
    return columns;
  };

  const getPriorityColumns = () => {
    return columns
      .filter(col => col.priority === 'high')
      .slice(0, 2); // Show max 2 high priority columns on mobile
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows.map((row) => {
          const rowId = row[keyField];
          const isExpanded = expandedRows.has(rowId);
          const priorityColumns = getPriorityColumns();
          
          return (
            <Card
              key={rowId}
              sx={{
                cursor: onRowClick ? 'pointer' : 'default',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                },
              }}
              onClick={() => onRowClick?.(row)}
            >
              <CardContent sx={{ pb: 1 }}>
                {/* Card Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                  {mobileCardAvatar && (
                    <Box sx={{ mr: 2 }}>
                      {mobileCardAvatar(row)}
                    </Box>
                  )}
                  
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>
                      {mobileCardTitle ? mobileCardTitle(row) : row[columns[0].id]}
                    </Typography>
                    {mobileCardSubtitle && (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {mobileCardSubtitle(row)}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {expandableContent && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpansion(rowId);
                        }}
                      >
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    )}
                    
                    {actions.length > 0 && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleActionClick(e, row)}
                      >
                        <MoreVert />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                {/* Priority Fields */}
                {priorityColumns.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                    {priorityColumns.map((column) => (
                      <Box key={column.id} sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary">
                          {column.label}
                        </Typography>
                        <Typography variant="body2" noWrap>
                          {column.format ? column.format(row[column.id]) : row[column.id]}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Expandable Content */}
                {expandableContent && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      {expandableContent(row)}
                    </Box>
                  </Collapse>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleActionClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {actions.map((action, index) => (
            <MenuItem
              key={index}
              onClick={() => handleActionItemClick(action)}
              disabled={action.disabled?.(selectedRow)}
              sx={{
                color: action.color ? `${action.color}.main` : 'inherit',
              }}
            >
              {action.icon && (
                <Box sx={{ mr: 1, display: 'flex' }}>
                  {action.icon}
                </Box>
              )}
              {action.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  // Desktop Table View
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {getVisibleColumns().map((column) => (
              <TableCell
                key={column.id}
                align={column.align}
                style={{ minWidth: column.minWidth }}
                sx={{
                  fontWeight: 'bold',
                  bgcolor: 'background.paper',
                }}
              >
                {column.label}
              </TableCell>
            ))}
            {actions.length > 0 && (
              <TableCell align="center" sx={{ width: 80 }}>
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row[keyField]}
              hover
              sx={{
                cursor: onRowClick ? 'pointer' : 'default',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => onRowClick?.(row)}
            >
              {getVisibleColumns().map((column) => (
                <TableCell key={column.id} align={column.align}>
                  {column.format ? column.format(row[column.id]) : row[column.id]}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => handleActionClick(e, row)}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => handleActionItemClick(action)}
            disabled={action.disabled?.(selectedRow)}
            sx={{
              color: action.color ? `${action.color}.main` : 'inherit',
            }}
          >
            {action.icon && (
              <Box sx={{ mr: 1, display: 'flex' }}>
                {action.icon}
              </Box>
            )}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </TableContainer>
  );
};

export default ResponsiveDataGrid;
