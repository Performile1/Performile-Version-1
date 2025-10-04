import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Badge,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  AttachFile as AttachIcon,
  MoreVert as MoreIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  conversation_id: string;
  subject: string;
  last_message_at: string;
  unread_count: number;
  participants: Array<{
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    user_role: string;
  }>;
  last_message: {
    message_text: string;
    sender_id: string;
    created_at: string;
  };
}

interface Message {
  message_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  is_edited: boolean;
  sender_first_name: string;
  sender_last_name: string;
  sender_role: string;
  read_count: number;
  attachments: any;
}

export const MessagingCenter: React.FC = () => {
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [newConversationOpen, setNewConversationOpen] = useState(false);

  // Fetch conversations
  const { data: conversationsData, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiClient.get('/messages/conversations');
      return response.data;
    },
    refetchInterval: 30000, // Poll every 30 seconds
    retry: false,
  });

  const conversations: Conversation[] = conversationsData?.data || [];

  // Fetch messages for selected conversation
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return null;
      const response = await apiClient.get('/messages', {
        params: { conversation_id: selectedConversation }
      });
      return response.data;
    },
    enabled: !!selectedConversation,
    refetchInterval: 10000, // Poll every 10 seconds
    retry: false,
  });

  const messages: Message[] = messagesData?.data || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversation_id: string; message_text: string }) => {
      const response = await apiClient.post('/messages', data);
      return response.data;
    },
    onSuccess: () => {
      setMessageText('');
      refetchMessages();
      refetchConversations();
      scrollToBottom();
    },
  });

  // Create conversation mutation (for future use)
  // const createConversationMutation = useMutation({
  //   mutationFn: async (data: { participant_ids: string[]; subject: string }) => {
  //     const response = await apiClient.post('/messages/conversations', data);
  //     return response.data;
  //   },
  //   onSuccess: (data) => {
  //     setNewConversationOpen(false);
  //     setSelectedConversation(data.data.conversation_id);
  //     refetchConversations();
  //   },
  // });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversation_id: selectedConversation,
      message_text: messageText.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipants = (conversation: Conversation) => {
    return conversation.participants?.filter(p => p.user_id !== user?.user_id) || [];
  };

  const getConversationTitle = (conversation: Conversation) => {
    const others = getOtherParticipants(conversation);
    if (others.length === 0) return 'You';
    if (others.length === 1) return `${others[0].first_name} ${others[0].last_name}`;
    return `${others[0].first_name} +${others.length - 1} others`;
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationTitle(conv).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.conversation_id === selectedConversation);

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', gap: 0 }}>
      {/* Conversations List */}
      <Card sx={{ width: 350, display: 'flex', flexDirection: 'column', borderRadius: 0 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Messages</Typography>
            <Tooltip title="New Conversation">
              <IconButton size="small" onClick={() => setNewConversationOpen(true)}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
          {filteredConversations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No conversations yet
              </Typography>
            </Box>
          ) : (
            filteredConversations.map((conversation) => {
              const others = getOtherParticipants(conversation);
              const isSelected = conversation.conversation_id === selectedConversation;

              return (
                <ListItem
                  key={conversation.conversation_id}
                  button
                  selected={isSelected}
                  onClick={() => setSelectedConversation(conversation.conversation_id)}
                  sx={{
                    borderLeft: isSelected ? 3 : 0,
                    borderColor: 'primary.main',
                    bgcolor: isSelected ? 'action.selected' : 'transparent',
                  }}
                >
                  <ListItemAvatar>
                    <Badge badgeContent={conversation.unread_count} color="error">
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {others[0]?.first_name?.[0] || 'U'}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={conversation.unread_count > 0 ? 'bold' : 'normal'}>
                          {getConversationTitle(conversation)}
                        </Typography>
                        {conversation.last_message_at && (
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ fontWeight: conversation.unread_count > 0 ? 'bold' : 'normal' }}
                      >
                        {conversation.last_message?.message_text || 'No messages yet'}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })
          )}
        </List>
      </Card>

      {/* Messages Area */}
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', borderRadius: 0 }}>
        {selectedConversation && selectedConv ? (
          <>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {getOtherParticipants(selectedConv)[0]?.first_name?.[0] || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {getConversationTitle(selectedConv)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getOtherParticipants(selectedConv).map(p => p.user_role).join(', ')}
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreIcon />
              </IconButton>
            </Box>

            {/* Messages */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.user_id;
                const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

                return (
                  <Box
                    key={message.message_id}
                    sx={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      mb: 1,
                      gap: 1,
                    }}
                  >
                    {!isOwn && showAvatar && (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                        {message.sender_first_name?.[0]}
                      </Avatar>
                    )}
                    {!isOwn && !showAvatar && <Box sx={{ width: 32 }} />}

                    <Box sx={{ maxWidth: '70%' }}>
                      {!isOwn && showAvatar && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {message.sender_first_name} {message.sender_last_name}
                        </Typography>
                      )}
                      <Paper
                        sx={{
                          p: 1.5,
                          bgcolor: isOwn ? 'primary.main' : 'white',
                          color: isOwn ? 'white' : 'text.primary',
                          borderRadius: 2,
                          borderTopLeftRadius: !isOwn && showAvatar ? 0 : 2,
                          borderTopRightRadius: isOwn && showAvatar ? 0 : 2,
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.message_text}
                        </Typography>
                        {message.is_edited && (
                          <Typography variant="caption" sx={{ opacity: 0.7, fontStyle: 'italic' }}>
                            (edited)
                          </Typography>
                        )}
                      </Paper>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5, px: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </Typography>
                        {isOwn && (
                          <Tooltip title={message.read_count > 0 ? 'Read' : 'Sent'}>
                            {message.read_count > 0 ? (
                              <DoneAllIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                            ) : (
                              <CheckIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            )}
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small">
                        <AttachIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                      >
                        <SendIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              Select a conversation to start messaging
            </Typography>
          </Box>
        )}
      </Card>

      {/* Conversation Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          Archive
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* New Conversation Dialog */}
      <Dialog open={newConversationOpen} onClose={() => setNewConversationOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Conversation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            New conversation feature coming soon!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConversationOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
