import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  InputAdornment,
  Divider,
  Fade,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Search,
  LocalShipping,
  Store,
  Person,
  Receipt,
  Close,
  History,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { apiClient } from '@/services/apiClient';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'order' | 'courier' | 'store' | 'user';
  title: string;
  subtitle?: string;
  metadata?: string;
  url: string;
}

interface GlobalSearchProps {
  onClose?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onClose,
  placeholder = "Search orders, couriers, stores...",
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('performile_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('performile_recent_searches', JSON.stringify(updated));
  };

  // Search API call
  const { data: searchResults = [], isLoading } = useQuery(
    ['globalSearch', query],
    async () => {
      if (!query.trim() || query.length < 2) return [];
      
      const response = await apiClient.get(`/search?q=${encodeURIComponent(query)}&limit=10`);
      return response.data.results || [];
    },
    {
      enabled: query.length >= 2,
      staleTime: 30000,
    }
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Receipt />;
      case 'courier':
        return <LocalShipping />;
      case 'store':
        return <Store />;
      case 'user':
        return <Person />;
      default:
        return <Search />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'primary';
      case 'courier':
        return 'success';
      case 'store':
        return 'warning';
      case 'user':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    navigate(result.url);
    setQuery('');
    setIsOpen(false);
    onClose?.();
  };

  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    setIsOpen(true);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('performile_recent_searches');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setQuery('');
      setIsOpen(false);
      onClose?.();
    }
  };

  const showResults = isOpen && (query.length >= 2 || recentSearches.length > 0);

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
      <TextField
        ref={inputRef}
        fullWidth
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {isLoading && <CircularProgress size={20} />}
              {(query || isOpen) && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setQuery('');
                    setIsOpen(false);
                    onClose?.();
                  }}
                >
                  <Close />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />

      <Fade in={showResults}>
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1300,
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          {query.length >= 2 ? (
            // Search results
            <>
              {searchResults.length > 0 ? (
                <List dense>
                  {searchResults.map((result: SearchResult) => (
                    <ListItem
                      key={`${result.type}-${result.id}`}
                      button
                      onClick={() => handleResultClick(result)}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon>
                        {getIcon(result.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" noWrap>
                              {result.title}
                            </Typography>
                            <Chip
                              label={result.type}
                              size="small"
                              color={getTypeColor(result.type) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            {result.subtitle && (
                              <Typography variant="caption" color="text.secondary">
                                {result.subtitle}
                              </Typography>
                            )}
                            {result.metadata && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                • {result.metadata}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No results found for "{query}"
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            // Recent searches
            recentSearches.length > 0 && (
              <>
                <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Recent Searches
                  </Typography>
                  <IconButton size="small" onClick={clearRecentSearches}>
                    <Close />
                  </IconButton>
                </Box>
                <List dense>
                  {recentSearches.map((searchQuery) => (
                    <ListItem
                      key={searchQuery}
                      button
                      onClick={() => handleRecentSearchClick(searchQuery)}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <History />
                      </ListItemIcon>
                      <ListItemText
                        primary={searchQuery}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )
          )}

          {/* Search tips */}
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Search by tracking number, order ID, store name, or courier name
            </Typography>
          </Box>
        </Paper>
      </Fade>

      {/* Backdrop to close search */}
      {showResults && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
          }}
          onClick={() => {
            setIsOpen(false);
            onClose?.();
          }}
        />
      )}
    </Box>
  );
};

export default GlobalSearch;
