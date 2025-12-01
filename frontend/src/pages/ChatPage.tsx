import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faComment, faSearch, faTimes, faUserMinus, faUserPlus, 
  faClock, faCheck, faCheckDouble, faCheckCircle,
  faImage, faVideo, faFile, faMicrophone, faMapMarkerAlt, faPlay, faPause
} from '@fortawesome/free-solid-svg-icons';
import { User, Message, FriendRequest, Chat, MessageAttachment } from '../utils/api';
import { apiService } from '../utils/api';
import { websocketService, WebSocketMessage } from '../utils/websocket';
import { formatDateTime } from '../utils/dateFormatter';
import { ensureNumericId, isNumericId } from '../utils/idConverter';
import { API_BASE_URL } from '../utils/constants';
import MessageInput from '../components/MessageInput';
import '../components/Chat.css';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'add' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState<FriendRequest[]>([]);
  const [incomingRequestCount, setIncomingRequestCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [clickedAddButtons, setClickedAddButtons] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadChatsRef = useRef<(() => Promise<void>) | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCurrentUser = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        // Verify user exists in backend using stored email and id
        try {
          const verifiedUser = await apiService.getCurrentUser(userData.email, userData.id);
          setCurrentUser(verifiedUser);
        } catch (err: any) {
          // If user not found, clear localStorage and redirect to login
          console.error('Failed to verify user:', err);
          localStorage.removeItem('user');
          navigate('/login');
        }
      } else {
        // No stored user - redirect to login
        navigate('/login');
      }
    } catch (err) {
      console.error('Failed to load current user:', err);
      navigate('/login');
    }
  };

  const connectWebSocket = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      await websocketService.connect(currentUser.id);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [currentUser?.id]);

  const loadChats = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const chatsList = await apiService.getChats(currentUser.id);
      setChats(chatsList);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Store loadChats in ref for use in other callbacks
  useEffect(() => {
    loadChatsRef.current = loadChats;
  }, [loadChats]);

  const loadFriendRequests = useCallback(async () => {
    if (!currentUser?.id) {
      setFriendRequests([]);
      setOutgoingFriendRequests([]);
      return;
    }
    try {
      const [incoming, outgoing] = await Promise.all([
        apiService.getIncomingFriendRequests(currentUser.id),
        apiService.getOutgoingFriendRequests(currentUser.id)
      ]);
      setFriendRequests(incoming || []);
      setOutgoingFriendRequests(outgoing || []);
    } catch (err) {
      console.error('Failed to load friend requests:', err);
      // If error, clear requests
      setFriendRequests([]);
      setOutgoingFriendRequests([]);
    }
  }, [currentUser?.id]);

  const loadIncomingRequestCount = useCallback(async () => {
    if (!currentUser?.id) {
      setIncomingRequestCount(0);
      return;
    }
    try {
      const { incomingRequestCount } = await apiService.getIncomingFriendRequestCount(currentUser.id);
      setIncomingRequestCount(incomingRequestCount || 0);
    } catch (err) {
      console.error('Failed to load incoming request count:', err);
      // If user not found or error, set count to 0
      setIncomingRequestCount(0);
    }
  }, [currentUser?.id]);

  const loadMessages = useCallback(async () => {
    if (!currentUser?.id || !selectedFriend?.id) return;
    try {
      const conversationMessages = await apiService.getConversation(
        currentUser.id,
        selectedFriend.id
      );
      setMessages(conversationMessages);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [currentUser?.id, selectedFriend?.id]);

  const markConversationRead = useCallback(async () => {
    if (!currentUser?.id || !selectedFriend?.id) return;
    try {
      await apiService.markConversationRead(currentUser.id, selectedFriend.id);
      // Refresh chats to update unread count using ref to avoid dependency issues
      if (loadChatsRef.current) {
        loadChatsRef.current();
      }
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }
  }, [currentUser?.id, selectedFriend?.id]);

  // Load current user
  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Connect WebSocket when user is loaded
  useEffect(() => {
    if (!currentUser?.id) return;
    
    connectWebSocket();
    loadChats();
    loadFriendRequests();
    loadIncomingRequestCount();
    
    return () => {
      websocketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Setup WebSocket listeners
  useEffect(() => {
    if (!currentUser?.id) return;

    const handleNewMessage = (data: WebSocketMessage) => {
      if (data.message) {
        const message = data.message as Message;
        // Add message if it's for current conversation
        if (selectedFriend && 
            ((message.fromUserId === selectedFriend.id && message.toUserId === currentUser.id) ||
             (message.fromUserId === currentUser.id && message.toUserId === selectedFriend.id))) {
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(m => m.id === message.id)) {
              return prev;
            }
            return [...prev, message];
          });
          scrollToBottom();
        }
        
        // Update chats list
        loadChats();
      }
    };

    const handleMessageRead = (data: WebSocketMessage) => {
      if (data.messageId && selectedFriend) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, read: true, status: 'read', readAt: data.readAt }
            : msg
        ));
      }
    };

    const handleMessagesRead = (data: WebSocketMessage) => {
      if (data.userId === selectedFriend?.id) {
        setMessages(prev => prev.map(msg => 
          msg.fromUserId === currentUser.id && msg.toUserId === selectedFriend.id
            ? { ...msg, read: true, status: 'read' }
            : msg
        ));
      }
    };

    const handleTyping = (data: WebSocketMessage) => {
      if (data.userId && data.userId === selectedFriend?.id) {
        if (data.isTyping) {
          setTypingUsers(prev => new Set(prev).add(data.userId!));
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId!);
            return newSet;
          });
        }
      }
    };

    websocketService.on('new_message', handleNewMessage);
    websocketService.on('message_read', handleMessageRead);
    websocketService.on('messages_read', handleMessagesRead);
    websocketService.on('typing', handleTyping);

    return () => {
      websocketService.off('new_message', handleNewMessage);
      websocketService.off('message_read', handleMessageRead);
      websocketService.off('messages_read', handleMessagesRead);
      websocketService.off('typing', handleTyping);
    };
  }, [currentUser?.id, selectedFriend?.id]);

  // Load chats periodically
  useEffect(() => {
    if (!currentUser?.id) return;
    
    if (activeTab === 'friends') {
      // Use Page Visibility API to pause polling when tab is hidden
      let interval: NodeJS.Timeout | null = null;
      
      const startPolling = () => {
        if (document.visibilityState === 'visible') {
          interval = setInterval(loadChats, 5000);
        }
      };
      
      const stopPolling = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Reload immediately when tab becomes visible
          loadChats();
          startPolling();
        } else {
          stopPolling();
        }
      };
      
      // Load immediately and start polling if tab is visible
      if (document.visibilityState === 'visible') {
        loadChats();
        startPolling();
      }
      
      // Listen for visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        stopPolling();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [currentUser?.id, activeTab, loadChats]);

  // Load friend requests periodically - always load to show count on button
  useEffect(() => {
    if (!currentUser?.id) return;
    
    // Always load friend requests initially to show count on button
    loadFriendRequests();
    
    if (activeTab === 'requests') {
      loadIncomingRequestCount();
      loadChats(); // Also reload chats to check if any requests were accepted
      
      // Use Page Visibility API to pause polling when tab is hidden
      let interval: NodeJS.Timeout | null = null;
      
      const startPolling = () => {
        if (document.visibilityState === 'visible') {
          interval = setInterval(() => {
            loadFriendRequests();
            loadIncomingRequestCount();
            loadChats(); // Check if any requests were accepted
          }, 5000);
        }
      };
      
      const stopPolling = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Reload immediately when tab becomes visible
          loadFriendRequests();
          loadIncomingRequestCount();
          loadChats();
          startPolling();
        } else {
          stopPolling();
        }
      };
      
      // Start polling if tab is visible
      if (document.visibilityState === 'visible') {
        startPolling();
      }
      
      // Listen for visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        stopPolling();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      // When not on requests tab, still poll friend requests less frequently to keep count updated
      let interval: NodeJS.Timeout | null = null;
      
      const startPolling = () => {
        if (document.visibilityState === 'visible') {
          interval = setInterval(() => {
            loadFriendRequests();
          }, 10000); // Poll every 10 seconds when tab is not active
        }
      };
      
      const stopPolling = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          loadFriendRequests();
          startPolling();
        } else {
          stopPolling();
        }
      };
      
      if (document.visibilityState === 'visible') {
        startPolling();
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        stopPolling();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [currentUser?.id, activeTab, loadFriendRequests, loadIncomingRequestCount, loadChats]);

  // Load messages when friend is selected
  useEffect(() => {
    if (currentUser?.id && selectedFriend?.id) {
      loadMessages();
      markConversationRead();
    }
  }, [currentUser?.id, selectedFriend?.id, loadMessages, markConversationRead]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (
    content: string,
    type: string = 'text',
    attachments?: MessageAttachment[],
    metadata?: any
  ) => {
    if (!currentUser || !selectedFriend) return;

    setIsTyping(false);
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    websocketService.sendTyping(selectedFriend.id, false);

    try {
      const sentMessage = await apiService.sendMessage(
        currentUser.id,
        selectedFriend.id,
        content,
        type,
        attachments,
        metadata
      );
      
      // Add message to list immediately
      setMessages(prev => [...prev, sentMessage]);
      scrollToBottom();
      
      // Mark as delivered if recipient is online
      if (websocketService.isConnected()) {
        websocketService.markDelivered(sentMessage.id);
      }
      
      // Reload chats to update last message
      loadChats();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err.message || 'Хабарлама жіберу қатесі');
    }
  };

  const handleUploadFile = async (
    file: File,
    type: string,
    content?: string,
    metadata?: any
  ) => {
    if (!currentUser || !selectedFriend) return;

    try {
      const sentMessage = await apiService.uploadFile(
        file,
        currentUser.id,
        selectedFriend.id,
        type as 'image' | 'audio' | 'video' | 'file',
        content,
        metadata
      );
      
      // Add message to list immediately
      setMessages(prev => [...prev, sentMessage]);
      scrollToBottom();
      
      // Mark as delivered if recipient is online
      if (websocketService.isConnected()) {
        websocketService.markDelivered(sentMessage.id);
      }
      
      // Reload chats to update last message
      loadChats();
    } catch (err: any) {
      console.error('Failed to upload file:', err);
      alert(err.message || 'Файл жүктеу қатесі');
    }
  };


  const handleSearchUsers = async (query: string) => {
    if (!currentUser) {
      setSearchResults([]);
      return;
    }
    
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    
    if (trimmedQuery.length < 1) {
      return;
    }
    
    try {
      setSearching(true);
      
      // Егер сұрау тек сандардан тұрса (ID), тікелей пайдаланушыны табуға тырысу
      let results: User[] = [];
      
      if (isNumericId(trimmedQuery)) {
        // ID арқылы тікелей іздеу
        try {
          // ID-ны 12 цифрға дейін форматтау (егер қысқа болса)
          let numericId = trimmedQuery;
          if (numericId.length < 12) {
            numericId = numericId.padStart(12, '0');
          }
          
          console.log('Searching user by ID:', numericId);
          const user = await apiService.getUserProfile(numericId);
          
          // Егер пайдаланушы табылса және бұл ағымдағы пайдаланушы емес
          if (user && user.id !== currentUser.id) {
            // Дос емес екенін тексеру
            const friendIds = new Set(chats.map(chat => chat.partnerId));
            if (!friendIds.has(user.id)) {
              results = [user];
              console.log('User found by ID:', user);
            }
          }
        } catch (err: any) {
          // Егер ID арқылы табылмаса (404), тихо өңдеу - бұл қалыпты жағдай
          // 404 қатесін консольге шығармау, тек нәтижелерді тазалау
          const is404 = err.message?.includes('404') || 
                       err.message?.includes('табылмады') || 
                       err.message?.includes('not found') ||
                       err.message?.includes('User not found');
          
          if (!is404) {
            // Басқа қателер үшін консольге шығару
            console.error('Failed to search user by ID:', err);
          } else {
            console.log('User not found by ID, trying general search');
          }
          
          // ID арқылы табылмаса, жалпы іздеуге өту
          // Бұл жерде return қалдырмаймыз, өйткені жалпы іздеуге өту керек
        }
      }
      
      // Егер ID арқылы табылмаса немесе сұрау ID емес болса, жалпы іздеу
      if (results.length === 0) {
        results = await apiService.searchUsers(trimmedQuery);
      }
      
      // Filter out current user and existing friends
      const friendIds = new Set(chats.map(chat => chat.partnerId));
      let filtered = results.filter(
        user => user.id !== currentUser.id && !friendIds.has(user.id)
      );
      
      // Verify that each user still exists (filter out deleted accounts)
      // Check users in parallel for better performance
      const userExistenceChecks = await Promise.allSettled(
        filtered.map(async (user) => {
          try {
            await apiService.getUserProfile(user.id);
            return user;
          } catch (err: any) {
            // If user not found (404), account was deleted
            if (err.message?.includes('404') || err.message?.includes('not found') || err.message?.includes('табылмады')) {
              return null;
            }
            // For other errors, assume user still exists
            return user;
          }
        })
      );
      
      // Filter out null values (deleted accounts)
      filtered = userExistenceChecks
        .map((result) => result.status === 'fulfilled' ? result.value : null)
        .filter((user): user is User => user !== null);
      
      setSearchResults(filtered);
    } catch (err: any) {
      console.error('Failed to search users:', err);
      // Show error message to user
      const errorMsg = err.message || 'Іздеу қатесі';
      if (!errorMsg.includes('Failed to fetch') && !errorMsg.includes('NetworkError')) {
        console.error('Search error:', errorMsg);
      }
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (toUserId: string) => {
    if (!currentUser) return;
    // Батырма басылғанын белгілеу
    setClickedAddButtons(prev => new Set(prev).add(toUserId));
    try {
      await apiService.sendFriendRequest(currentUser.id, toUserId);
      await loadIncomingRequestCount();
      await loadChats();
      alert('Достық сұрауы жіберілді');
    } catch (err: any) {
      console.error('Failed to send friend request:', err);
      const errorMsg = err.message || 'Достық сұрауы жіберу қатесі';
      if (errorMsg.includes('already exists') || errorMsg.includes('уже существует')) {
        alert('Достық сұрауы қазірдің өзінде жіберілген');
      } else if (errorMsg.includes('Already friends')) {
        await loadChats();
        alert('Сіз бұл пайдаланушымен қазірдің өзінде доссыз');
      } else {
        alert(errorMsg);
      }
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await apiService.acceptFriendRequest(requestId);
      await loadFriendRequests();
      await loadIncomingRequestCount();
      await loadChats();
      alert('Достық сұрауы қабылданды');
    } catch (err) {
      console.error('Failed to accept friend request:', err);
      alert('Достық сұрауы қабылдау қатесі');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await apiService.rejectFriendRequest(requestId);
      await loadFriendRequests();
      await loadIncomingRequestCount();
      alert('Достық сұрауы бас тартылды');
    } catch (err) {
      console.error('Failed to reject friend request:', err);
      alert('Достық сұрауы бас тарту қатесі');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!currentUser) return;
    try {
      await apiService.cancelFriendRequest(requestId, currentUser.id);
      await loadFriendRequests();
      await loadIncomingRequestCount();
      alert('Достық сұрауы жойылды');
    } catch (err) {
      console.error('Failed to cancel friend request:', err);
      alert('Достық сұрауы жою қатесі');
    }
  };

  const handleRemoveFriend = async (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    
    if (!window.confirm('Бұл досыңызды тізімнен алып тастағыңыз келе ме?')) {
      return;
    }
    
    try {
      await apiService.removeFriend(currentUser.id, friendId);
      await loadChats();
      if (selectedFriend?.id === friendId) {
        setSelectedFriend(null);
        setMessages([]);
      }
      alert('Дос алып тастылды');
    } catch (err) {
      console.error('Failed to remove friend:', err);
      alert('Дос алып тастау қатесі');
    }
  };

  const getMessageStatusIcon = (message: Message) => {
    if (message.status === 'read') {
      return <FontAwesomeIcon icon={faCheckCircle} className="message-status read" />;
    } else if (message.status === 'delivered') {
      return <FontAwesomeIcon icon={faCheckDouble} className="message-status delivered" />;
    } else {
      return <FontAwesomeIcon icon={faCheck} className="message-status sent" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Қазір';
    if (minutes < 60) return `${minutes} мин бұрын`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} сағ бұрын`;
    
    return formatDateTime(dateString, i18n.language);
  };

  const renderMessageContent = (message: Message) => {
    const messageType = message.type || 'text';
    
    // Helper to get full URL
    const getFullUrl = (url: string) => {
      if (url.startsWith('http')) return url;
      // If URL already starts with /api, use API_BASE_URL directly
      if (url.startsWith('/api')) return `${API_BASE_URL.replace('/api', '')}${url}`;
      // Otherwise, assume it's relative to /api/uploads
      return `${API_BASE_URL.replace('/api', '')}/api${url}`;
    };

    switch (messageType) {
      case 'image':
        if (message.attachments && message.attachments.length > 0) {
          return (
            <div className="chat-message-media">
              {message.attachments.map((att, idx) => {
                const imageUrl = getFullUrl(att.url);
                return (
                  <div key={idx} className="chat-message-image-wrapper">
                    <img
                      src={imageUrl}
                      alt={att.filename}
                      className="chat-message-image"
                      onClick={() => {
                        // Open image in new tab
                        window.open(imageUrl, '_blank');
                      }}
                    />
                  </div>
                );
              })}
              {message.content && (
                <div className="chat-message-text">{message.content}</div>
              )}
            </div>
          );
        }
        break;

      case 'video':
        if (message.attachments && message.attachments.length > 0) {
          return (
            <div className="chat-message-media">
              {message.attachments.map((att, idx) => (
                <div key={idx} className="chat-message-video-wrapper">
                  <video
                    src={getFullUrl(att.url)}
                    controls
                    className="chat-message-video"
                  />
                </div>
              ))}
              {message.content && (
                <div className="chat-message-text">{message.content}</div>
              )}
            </div>
          );
        }
        break;

      case 'audio':
        if (message.attachments && message.attachments.length > 0) {
          return (
            <div className="chat-message-media">
              {message.attachments.map((att, idx) => (
                <div key={idx} className="chat-message-audio-wrapper">
                  <audio
                    src={getFullUrl(att.url)}
                    controls
                    className="chat-message-audio"
                  />
                </div>
              ))}
              {message.content && (
                <div className="chat-message-text">{message.content}</div>
              )}
            </div>
          );
        }
        break;

      case 'file':
        if (message.attachments && message.attachments.length > 0) {
          return (
            <div className="chat-message-media">
              {message.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={getFullUrl(att.url)}
                  download={att.filename}
                  className="chat-message-file"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FontAwesomeIcon icon={faFile} />
                  <div className="chat-message-file-info">
                    <div className="chat-message-file-name">{att.filename}</div>
                    <div className="chat-message-file-size">
                      {(att.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </a>
              ))}
              {message.content && (
                <div className="chat-message-text">{message.content}</div>
              )}
            </div>
          );
        }
        break;

      case 'location':
        if (message.metadata?.latitude && message.metadata?.longitude) {
          const { latitude, longitude, address } = message.metadata;
          const mapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;
          
          return (
            <div className="chat-message-location">
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-location-link"
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <div className="chat-location-info">
                  <div className="chat-location-address">
                    {address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
                  </div>
                  <div className="chat-location-coords">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </div>
                </div>
              </a>
              {message.content && (
                <div className="chat-message-text">{message.content}</div>
              )}
            </div>
          );
        }
        break;

      case 'emoji':
        return (
          <div className="chat-message-emoji">
            {message.metadata?.emoji || message.content}
          </div>
        );

      case 'sticker':
        return (
          <div className="chat-message-sticker">
            {message.metadata?.stickerId ? (
              <div className="sticker-placeholder">
                Sticker: {message.metadata.stickerId}
              </div>
            ) : (
              message.content
            )}
          </div>
        );

      default:
        return <div className="chat-message-text">{message.content}</div>;
    }

    // Fallback to text
    return <div className="chat-message-text">{message.content || ''}</div>;
  };

  const filteredChats = chats.filter(chat =>
    chat.partner.username.toLowerCase().includes(friendsSearchQuery.toLowerCase()) ||
    chat.partner.email.toLowerCase().includes(friendsSearchQuery.toLowerCase())
  );

  return (
    <div className="chat-page-container">
      <div className="chat-header">
        <h3><FontAwesomeIcon icon={faComment} /> Чат</h3>
      </div>

      <div className="chat-content">
        <div className="chat-friends-list">
          <div className="chat-tabs">
            <button
              className={`chat-tab ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              Достар ({chats.length})
            </button>
            <button
              className={`chat-tab ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => setActiveTab('add')}
            >
              Қосу
            </button>
            <button
              className={`chat-tab ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Сұраулар {friendRequests.length > 0 && `(${friendRequests.length})`}
            </button>
          </div>

          {activeTab === 'friends' && (
            <>
              <div className="chat-friends-search">
                <div className="chat-friends-search-box">
                  <FontAwesomeIcon icon={faSearch} className="chat-search-icon" />
                  <input
                    type="text"
                    className="chat-friends-search-input"
                    placeholder="Достарды іздеу..."
                    value={friendsSearchQuery}
                    onChange={(e) => setFriendsSearchQuery(e.target.value)}
                  />
                  {friendsSearchQuery && (
                    <button
                      className="chat-clear-search-btn"
                      onClick={() => setFriendsSearchQuery('')}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              </div>
              {loading ? (
                <div className="chat-loading">Жүктелуде...</div>
              ) : filteredChats.length === 0 ? (
                <div className="chat-empty">
                  {friendsSearchQuery ? 'Дос табылмады' : 'Достар тізімі бос'}
                </div>
              ) : (
                <div className="chat-friends-items">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.partnerId}
                      className={`chat-friend-item ${selectedFriend?.id === chat.partnerId ? 'active' : ''} ${chat.unreadCount > 0 ? 'has-unread' : ''}`}
                      onClick={() => setSelectedFriend(chat.partner)}
                    >
                      <div className="chat-friend-avatar">
                        {chat.partner.avatar ? (
                          <img src={chat.partner.avatar} alt={chat.partner.username} />
                        ) : (
                          <span>{chat.partner.username.charAt(0).toUpperCase()}</span>
                        )}
                        {chat.unreadCount > 0 && (
                          <span className="chat-unread-badge">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="chat-friend-info">
                        <div className="chat-friend-header">
                          <div className="chat-friend-name">{chat.partner.username}</div>
                          {chat.lastMessage && (
                            <div className="chat-friend-time">
                              {formatTime(chat.lastMessage.createdAt)}
                            </div>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <div className="chat-friend-last-message">
                            {chat.lastMessage.fromUserId === currentUser?.id ? 'Сіз: ' : ''}
                            {chat.lastMessage.content.length > 40 
                              ? chat.lastMessage.content.substring(0, 40) + '...'
                              : chat.lastMessage.content}
                          </div>
                        )}
                      </div>
                      <button
                        className="chat-remove-friend-btn"
                        onClick={(e) => handleRemoveFriend(chat.partnerId, e)}
                        title="Дос алып тастау"
                      >
                        <FontAwesomeIcon icon={faUserMinus} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'add' && (
            <div className="chat-add-friends">
              <div className="chat-search-box">
                <div className="chat-search-input-wrapper">
                  <FontAwesomeIcon icon={faSearch} className="chat-search-icon" />
                  <input
                    type="text"
                    className="chat-search-input"
                    placeholder="Пайдаланушыны іздеу (аты, email немесе ID)..."
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      
                      if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current);
                      }
                      
                      if (!value.trim()) {
                        setSearchResults([]);
                        setSearching(false);
                        return;
                      }
                      
                      searchTimeoutRef.current = setTimeout(() => {
                        handleSearchUsers(value);
                      }, 500);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (searchTimeoutRef.current) {
                          clearTimeout(searchTimeoutRef.current);
                        }
                        handleSearchUsers(searchQuery);
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      className="chat-clear-search-btn"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        if (searchTimeoutRef.current) {
                          clearTimeout(searchTimeoutRef.current);
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              </div>
              {!searchQuery && (
                <div className="chat-add-info">
                  <div className="chat-info-icon">
                    <FontAwesomeIcon icon={faSearch} />
                  </div>
                  <p>Достар қосу үшін пайдаланушы атын, email-ді немесе ID-ді енгізіңіз</p>
                </div>
              )}
              {searching ? (
                <div className="chat-loading">Ізделуде...</div>
              ) : searchResults.length === 0 && searchQuery ? (
                <div className="chat-empty">Пайдаланушы табылмады</div>
              ) : (
                <div className="chat-search-results">
                  {searchResults.map((user) => {
                    const isFriend = chats.some(chat => chat.partnerId === user.id);
                    const hasRequest = friendRequests.some(req => req.fromUserId === user.id);
                    
                    return (
                      <div key={user.id} className="chat-search-item">
                        <div className="chat-friend-avatar">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} />
                          ) : (
                            <span>{user.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="chat-friend-info">
                          <div className="chat-friend-name">{user.username}</div>
                          <div className="chat-friend-email">{user.email}</div>
                          <div className="chat-friend-id">ID: {ensureNumericId(user.id)}</div>
                        </div>
                        {isFriend ? (
                          <button className="chat-add-btn chat-add-btn-pending" disabled>
                            <FontAwesomeIcon icon={faCheck} className="chat-btn-icon" />
                            Дос
                          </button>
                        ) : hasRequest ? (
                          <button className="chat-add-btn chat-add-btn-pending" disabled>
                            <FontAwesomeIcon icon={faClock} className="chat-btn-icon" />
                            Күтуде
                          </button>
                        ) : (
                          <button
                            className="chat-add-btn"
                            onClick={() => handleSendFriendRequest(user.id)}
                            title="Достық сұрауы жіберу"
                          >
                            <FontAwesomeIcon 
                              icon={clickedAddButtons.has(user.id) ? faCheckCircle : faUserPlus} 
                              className="chat-btn-icon" 
                            />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="chat-requests">
              {friendRequests.length === 0 && outgoingFriendRequests.length === 0 ? (
                <div className="chat-empty">Сұраулар жоқ</div>
              ) : (
                <div className="chat-requests-items">
                  {/* Келіп түскен сұраулар - бұл сізге келген сұраулар */}
                  {friendRequests.length > 0 && (
                    <>
                      {outgoingFriendRequests.length > 0 && (
                        <div className="chat-requests-section-title">Келіп түскен сұраулар</div>
                      )}
                      {friendRequests.map((request) => (
                        <div key={request.id} className="chat-request-item">
                          <div className="chat-friend-avatar">
                            {request.fromUser?.avatar ? (
                              <img src={request.fromUser.avatar} alt={request.fromUser.username} />
                            ) : (
                              <span>{request.fromUser?.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="chat-friend-info">
                            <div className="chat-friend-name">{request.fromUser?.username}</div>
                            <div className="chat-request-time">{formatTime(request.createdAt)}</div>
                          </div>
                          <div className="chat-request-actions">
                            <button
                              className="chat-accept-btn"
                              onClick={() => handleAcceptRequest(request.id)}
                            >
                              ✓
                            </button>
                            <button
                              className="chat-reject-btn"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* Жіберілген сұраулар - бұл сіз жіберген сұраулар */}
                  {outgoingFriendRequests.length > 0 && (
                    <>
                      {friendRequests.length > 0 && (
                        <div className="chat-requests-section-title">Жіберілген сұраулар</div>
                      )}
                      {outgoingFriendRequests.map((request) => (
                        <div key={request.id} className="chat-request-item chat-request-item-outgoing">
                          <div className="chat-friend-avatar">
                            {request.toUser?.avatar ? (
                              <img src={request.toUser.avatar} alt={request.toUser.username} />
                            ) : (
                              <span>{request.toUser?.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="chat-friend-info">
                            <div className="chat-friend-name">{request.toUser?.username}</div>
                            <div className="chat-request-time">{formatTime(request.createdAt)}</div>
                          </div>
                          <div className="chat-request-actions">
                            <button
                              className="chat-cancel-btn"
                              onClick={() => handleCancelRequest(request.id)}
                              title="Сұрауды жою"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="chat-messages-area">
          {selectedFriend ? (
            <>
              <div className="chat-messages-header">
                <div className="chat-messages-friend">
                  <div className="chat-friend-avatar small">
                    {selectedFriend.avatar ? (
                      <img src={selectedFriend.avatar} alt={selectedFriend.username} />
                    ) : (
                      <span>{selectedFriend.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span>{selectedFriend.username}</span>
                  {typingUsers.has(selectedFriend.id) && (
                    <span className="typing-indicator">жазуда...</span>
                  )}
                </div>
              </div>
              <div className="chat-messages-list" ref={messagesContainerRef}>
                {messages.map((message) => {
                  const isOwn = message.fromUserId === currentUser?.id;
                  return (
                    <div
                      key={message.id}
                      className={`chat-message ${isOwn ? 'own' : 'other'} ${message.type || 'text'}`}
                    >
                      <div className="chat-message-content">
                        {renderMessageContent(message)}
                      </div>
                      <div className="chat-message-footer">
                        <div className="chat-message-time">
                          {formatTime(message.createdAt)}
                        </div>
                        {isOwn && (
                          <div className="chat-message-status">
                            {getMessageStatusIcon(message)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <MessageInput
                onSendMessage={handleSendMessage}
                onUploadFile={handleUploadFile}
                disabled={!selectedFriend}
              />
            </>
          ) : (
            <div className="chat-no-selection">
              <div className="chat-no-selection-icon"><FontAwesomeIcon icon={faComment} /></div>
              <p>Дос таңдаңыз</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
