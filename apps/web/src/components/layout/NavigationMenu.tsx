import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { NavigationItem } from '@/types';

interface NavigationMenuProps {
  items: NavigationItem[];
  currentPath: string;
  userRole: string;
  onItemClick?: () => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  items,
  currentPath,
  userRole,
  onItemClick,
}) => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const handleItemClick = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      // Toggle submenu
      setOpenItems(prev =>
        prev.includes(item.path)
          ? prev.filter(path => path !== item.path)
          : [...prev, item.path]
      );
    } else {
      // Navigate to page
      navigate(item.path);
      onItemClick?.();
    }
  };

  const isItemActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const canAccessItem = (item: NavigationItem) => {
    return item.roles.includes(userRole);
  };

  const renderMenuItem = (item: NavigationItem, level = 0) => {
    if (!canAccessItem(item)) {
      return null;
    }

    const isActive = isItemActive(item.path);
    const isOpen = openItems.includes(item.path);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <React.Fragment key={item.path}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            selected={isActive}
            sx={{
              pl: 2 + level * 2,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              color: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
              '& .MuiListItemIcon-root': {
                color: 'rgba(255, 255, 255, 0.8)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <item.icon />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
              }}
            />
            {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <List sx={{ px: 1, py: 2 }}>
      {items.map(item => renderMenuItem(item))}
    </List>
  );
};
