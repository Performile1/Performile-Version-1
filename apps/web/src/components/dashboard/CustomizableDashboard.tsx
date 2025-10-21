/**
 * CUSTOMIZABLE DASHBOARD
 * Drag-and-drop dashboard with widget customization
 * Created: October 21, 2025
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Tooltip,
  Paper,
  Stack,
} from '@mui/material';
import {
  Settings,
  Add,
  Refresh,
  RestartAlt,
  Save,
  Close,
  DragIndicator,
} from '@mui/icons-material';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';
import toast from 'react-hot-toast';
import {
  WIDGET_REGISTRY,
  WidgetType,
  WidgetConfig,
} from './widgets/WidgetLibrary';

const ResponsiveGridLayout = WidthProvider(Responsive);

// ============================================================================
// DEFAULT LAYOUTS
// ============================================================================

const DEFAULT_LAYOUTS: Record<string, WidgetConfig[]> = {
  merchant: [
    { id: '1', type: 'performance-stats', title: 'Performance Stats', size: 'medium', position: { x: 0, y: 0 } },
    { id: '2', type: 'recent-orders', title: 'Recent Orders', size: 'medium', position: { x: 4, y: 0 } },
    { id: '3', type: 'active-deliveries', title: 'Active Deliveries', size: 'medium', position: { x: 8, y: 0 } },
    { id: '4', type: 'quick-actions', title: 'Quick Actions', size: 'small', position: { x: 0, y: 4 } },
    { id: '5', type: 'notifications', title: 'Notifications', size: 'medium', position: { x: 4, y: 4 } },
  ],
  courier: [
    { id: '1', type: 'active-deliveries', title: 'Active Deliveries', size: 'medium', position: { x: 0, y: 0 } },
    { id: '2', type: 'performance-stats', title: 'Performance Stats', size: 'medium', position: { x: 4, y: 0 } },
    { id: '3', type: 'recent-orders', title: 'Recent Orders', size: 'medium', position: { x: 8, y: 0 } },
    { id: '4', type: 'notifications', title: 'Notifications', size: 'medium', position: { x: 0, y: 4 } },
  ],
  admin: [
    { id: '1', type: 'performance-stats', title: 'Performance Stats', size: 'medium', position: { x: 0, y: 0 } },
    { id: '2', type: 'recent-orders', title: 'Recent Orders', size: 'medium', position: { x: 4, y: 0 } },
    { id: '3', type: 'active-deliveries', title: 'Active Deliveries', size: 'medium', position: { x: 8, y: 0 } },
    { id: '4', type: 'notifications', title: 'Notifications', size: 'medium', position: { x: 0, y: 4 } },
    { id: '5', type: 'quick-actions', title: 'Quick Actions', size: 'small', position: { x: 8, y: 4 } },
  ],
  consumer: [
    { id: '1', type: 'active-deliveries', title: 'My Deliveries', size: 'medium', position: { x: 0, y: 0 } },
    { id: '2', type: 'recent-orders', title: 'Recent Orders', size: 'medium', position: { x: 4, y: 0 } },
    { id: '3', type: 'notifications', title: 'Notifications', size: 'medium', position: { x: 0, y: 4 } },
  ],
};

// ============================================================================
// SIZE CONFIGURATIONS
// ============================================================================

const SIZE_CONFIG = {
  small: { w: 4, h: 3 },
  medium: { w: 4, h: 4 },
  large: { w: 8, h: 4 },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CustomizableDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load user's dashboard layout
  useEffect(() => {
    loadDashboardLayout();
  }, [user?.user_id]);

  const loadDashboardLayout = async () => {
    try {
      const response = await apiClient.get('/user/dashboard-layout');
      if (response.data.data?.layout) {
        setWidgets(response.data.data.layout);
      } else {
        // Use default layout for user's role
        const defaultLayout = DEFAULT_LAYOUTS[user?.user_role || 'merchant'] || DEFAULT_LAYOUTS.merchant;
        setWidgets(defaultLayout);
      }
    } catch (error) {
      console.error('Failed to load dashboard layout:', error);
      // Use default layout
      const defaultLayout = DEFAULT_LAYOUTS[user?.user_role || 'merchant'] || DEFAULT_LAYOUTS.merchant;
      setWidgets(defaultLayout);
    }
  };

  const saveDashboardLayout = async () => {
    try {
      await apiClient.post('/user/dashboard-layout', { layout: widgets });
      toast.success('Dashboard layout saved!');
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
      toast.error('Failed to save layout');
    }
  };

  const resetToDefault = () => {
    const defaultLayout = DEFAULT_LAYOUTS[user?.user_role || 'merchant'] || DEFAULT_LAYOUTS.merchant;
    setWidgets(defaultLayout);
    setHasChanges(true);
    toast.success('Reset to default layout');
  };

  const handleLayoutChange = (layout: Layout[]) => {
    if (!isCustomizing) return;

    const updatedWidgets = widgets.map(widget => {
      const layoutItem = layout.find(l => l.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          position: { x: layoutItem.x, y: layoutItem.y },
        };
      }
      return widget;
    });

    setWidgets(updatedWidgets);
    setHasChanges(true);
  };

  const toggleWidget = (widgetType: WidgetType) => {
    const exists = widgets.find(w => w.type === widgetType);
    
    if (exists) {
      // Remove widget
      setWidgets(widgets.filter(w => w.type !== widgetType));
    } else {
      // Add widget
      const newWidget: WidgetConfig = {
        id: Date.now().toString(),
        type: widgetType,
        title: WIDGET_REGISTRY[widgetType].title,
        size: WIDGET_REGISTRY[widgetType].defaultSize,
        position: { x: 0, y: Infinity }, // Add to bottom
      };
      setWidgets([...widgets, newWidget]);
    }
    
    setHasChanges(true);
  };

  const refreshAllWidgets = () => {
    // Force re-render of all widgets
    setWidgets([...widgets]);
    toast.success('Refreshing all widgets...');
  };

  // Convert widgets to grid layout
  const gridLayout: Layout[] = widgets.map(widget => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    ...SIZE_CONFIG[widget.size],
    minW: 2,
    minH: 2,
  }));

  return (
    <Box>
      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          My Dashboard
        </Typography>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh all widgets">
            <IconButton onClick={refreshAllWidgets} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>

          <Tooltip title="Customize dashboard">
            <IconButton 
              onClick={() => setIsCustomizing(!isCustomizing)}
              color={isCustomizing ? 'primary' : 'default'}
            >
              <Settings />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add widgets">
            <IconButton onClick={() => setDrawerOpen(true)} color="primary">
              <Add />
            </IconButton>
          </Tooltip>

          {hasChanges && (
            <>
              <Button
                variant="outlined"
                startIcon={<RestartAlt />}
                onClick={resetToDefault}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={saveDashboardLayout}
              >
                Save Layout
              </Button>
            </>
          )}
        </Stack>
      </Paper>

      {/* Customization Alert */}
      {isCustomizing && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Customization Mode:</strong> Drag widgets to reorder them. Click "Add widgets" to show/hide widgets.
        </Alert>
      )}

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: gridLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        isDraggable={isCustomizing}
        isResizable={false}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
      >
        {widgets.map(widget => {
          const WidgetComponent = WIDGET_REGISTRY[widget.type as WidgetType]?.component;
          
          if (!WidgetComponent) return null;

          return (
            <Box key={widget.id} sx={{ position: 'relative' }}>
              {isCustomizing && (
                <Box
                  className="drag-handle"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 10,
                    cursor: 'move',
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    p: 0.5,
                  }}
                >
                  <DragIndicator fontSize="small" />
                </Box>
              )}
              <WidgetComponent
                config={widget}
                onRefresh={() => setWidgets([...widgets])}
              />
            </Box>
          );
        })}
      </ResponsiveGridLayout>

      {/* Widget Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 350, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Available Widgets
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <List>
            {Object.entries(WIDGET_REGISTRY).map(([type, widget]) => {
              const isActive = widgets.some(w => w.type === type);
              
              return (
                <ListItem key={type} disablePadding>
                  <ListItemButton onClick={() => toggleWidget(type as WidgetType)}>
                    <ListItemIcon>{widget.icon}</ListItemIcon>
                    <ListItemText
                      primary={widget.title}
                      secondary={widget.description}
                    />
                    <Switch checked={isActive} edge="end" />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ my: 2 }} />

          <Button
            fullWidth
            variant="contained"
            startIcon={<Save />}
            onClick={() => {
              saveDashboardLayout();
              setDrawerOpen(false);
            }}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};
