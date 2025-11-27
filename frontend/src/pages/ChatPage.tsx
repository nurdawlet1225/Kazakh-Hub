import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faComment, faSearch, faTimes, faUserMinus, faUserPlus, 
  faClock, faCheck, faCheckDouble, faCheckCircle, faPaperPlane, faImage,
  faDownload, faShare, faMicrophone, faFile, faPlay, faPause
} from '@fortawesome/free-solid-svg-icons';
import { User, Message, FriendRequest, Chat } from '../utils/api';
import { apiService } from '../utils/api';
import { websocketService, WebSocketMessage } from '../utils/websocket';
import { formatDateTime } from '../utils/dateFormatter';
import '../components/Chat.css';

interface AudioPlayerProps {
  messageId: string;
  audioData: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  audioRef: (ref: HTMLAudioElement | null) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ messageId, audioData, isPlaying, onTogglePlay, audioRef }) => {
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioElementRef.current;
    if (audio) {
      audioRef(audio);
      
      const updateDuration = () => {
        setDuration(audio.duration || 0);
      };
      
      const updateTime = () => {
        setCurrentTime(audio.currentTime);
      };
      
      const handleEnded = () => {
        setCurrentTime(0);
      };
      
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioRef, audioData]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="chat-audio-player">
      <audio ref={audioElementRef} src={audioData} preload="metadata" />
      <button 
        className="chat-audio-play-btn"
        onClick={onTogglePlay}
      >
        <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
      </button>
      <div className="chat-audio-info">
        <div className="chat-audio-waveform">
          <div className="chat-audio-progress" style={{ width: `${progress}%` }} />
        </div>
        <div className="chat-audio-time">
          {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
        </div>
      </div>
    </div>
  );
};

const formatAudioTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ChatPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
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

  // Load current user
  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Connect WebSocket when user is loaded
  useEffect(() => {
    if (currentUser) {
      connectWebSocket();
      loadChats();
      loadFriendRequests();
      loadIncomingRequestCount();
      
      return () => {
        websocketService.disconnect();
      };
    }
  }, [currentUser]);

  // Setup WebSocket listeners
  useEffect(() => {
    if (!currentUser) return;

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
  }, [currentUser, selectedFriend]);

  // Load chats periodically
  useEffect(() => {
    if (!currentUser) return;
    
    if (activeTab === 'friends') {
      const interval = setInterval(loadChats, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, activeTab]);

  // Load friend requests periodically
  useEffect(() => {
    if (!currentUser) return;
    
    if (activeTab === 'requests') {
      loadFriendRequests();
      loadIncomingRequestCount();
      loadChats(); // Also reload chats to check if any requests were accepted
      const interval = setInterval(() => {
        loadFriendRequests();
        loadIncomingRequestCount();
        loadChats(); // Check if any requests were accepted
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, activeTab]);

  // Load messages when friend is selected
  useEffect(() => {
    if (currentUser && selectedFriend) {
      loadMessages();
      markConversationRead();
    }
  }, [currentUser, selectedFriend]);

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

  const connectWebSocket = async () => {
    if (!currentUser) return;
    try {
      await websocketService.connect(currentUser.id);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } else {
        const user = await apiService.getCurrentUser();
        setCurrentUser(user);
      }
    } catch (err) {
      console.error('Failed to load current user:', err);
    }
  };

  const loadChats = async () => {
    if (!currentUser) return;
    try {
      const chatsList = await apiService.getChats(currentUser.id);
      setChats(chatsList);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!currentUser || !selectedFriend) return;
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
  };

  const markConversationRead = async () => {
    if (!currentUser || !selectedFriend) return;
    try {
      await apiService.markConversationRead(currentUser.id, selectedFriend.id);
      loadChats(); // Refresh chats to update unread count
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Тек сурет файлдарын жіберуге болады');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Сурет өлшемі 5MB-тан аспауы керек');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an audio
    if (!file.type.startsWith('audio/')) {
      alert('Тек аудио файлдарын жіберуге болады');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Аудио өлшемі 10MB-тан аспауы керек');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedAudio(base64String);
      setAudioPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setSelectedAudio(base64String);
          setAudioPreview(base64String);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Микрофонға қол жеткізу мүмкін емес');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleAudioPlay = (messageId: string, audioData: string) => {
    const audio = audioRefs.current[messageId];
    
    if (!audio) return;
    
    if (playingAudioId === messageId) {
      // Pause current audio
      audio.pause();
      setPlayingAudioId(null);
    } else {
      // Stop other audio if playing
      if (playingAudioId) {
        const otherAudio = audioRefs.current[playingAudioId];
        if (otherAudio) {
          otherAudio.pause();
          otherAudio.currentTime = 0;
        }
      }
      // Play this audio
      audio.play().catch(err => {
        console.error('Failed to play audio:', err);
      });
      setPlayingAudioId(messageId);
      
      // Handle audio ended
      const handleEnded = () => {
        setPlayingAudioId(null);
        audio.removeEventListener('ended', handleEnded);
      };
      audio.addEventListener('ended', handleEnded);
    }
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage && !selectedAudio) || !currentUser || !selectedFriend) return;

    let messageContent = newMessage.trim();
    
    // Add image to message content if exists
    if (selectedImage) {
      if (messageContent) {
        messageContent = `${messageContent}\n[IMAGE:${selectedImage}]`;
      } else {
        messageContent = `[IMAGE:${selectedImage}]`;
      }
    }

    // Add audio to message content if exists
    if (selectedAudio) {
      if (messageContent) {
        messageContent = `${messageContent}\n[AUDIO:${selectedAudio}]`;
      } else {
        messageContent = `[AUDIO:${selectedAudio}]`;
      }
    }

    setNewMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedAudio(null);
    setAudioPreview(null);
    setIsTyping(false);
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    websocketService.sendTyping(selectedFriend.id, false);

    // Clear file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }

    try {
      const sentMessage = await apiService.sendMessage(
        currentUser.id,
        selectedFriend.id,
        messageContent
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

  const handleTypingChange = (value: string) => {
    setNewMessage(value);
    
    if (!selectedFriend || !currentUser) return;

    // Send typing indicator
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      websocketService.sendTyping(selectedFriend.id, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 3 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      websocketService.sendTyping(selectedFriend.id, false);
    }, 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveImage = (imageData: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to save image:', err);
      alert('Суретті сақтау қатесі');
    }
  };

  const handleForwardImage = (imageData: string) => {
    setSelectedImage(imageData);
    setImagePreview(imageData);
    // Scroll to input form
    setTimeout(() => {
      const inputForm = document.querySelector('.chat-input-form');
      inputForm?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadFriendRequests = async () => {
    if (!currentUser) return;
    try {
      const [incoming, outgoing] = await Promise.all([
        apiService.getIncomingFriendRequests(currentUser.id),
        apiService.getOutgoingFriendRequests(currentUser.id)
      ]);
      setFriendRequests(incoming);
      setOutgoingFriendRequests(outgoing);
    } catch (err) {
      console.error('Failed to load friend requests:', err);
    }
  };

  const loadIncomingRequestCount = async () => {
    if (!currentUser) return;
    try {
      const { incomingRequestCount } = await apiService.getIncomingFriendRequestCount(currentUser.id);
      setIncomingRequestCount(incomingRequestCount);
    } catch (err) {
      console.error('Failed to load incoming request count:', err);
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
      const results = await apiService.searchUsers(trimmedQuery);
      
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
              Сұраулар {incomingRequestCount > 0 && `(${incomingRequestCount})`}
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
                    placeholder="Пайдаланушыны іздеу (аты немесе email)..."
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
                  <p>Достар қосу үшін пайдаланушы атын немесе email-ді енгізіңіз</p>
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
                  {/* Келіп түскен сұраулар */}
                  {friendRequests.length > 0 && (
                    <>
                      {friendRequests.length > 0 && outgoingFriendRequests.length > 0 && (
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
                  
                  {/* Жіберілген сұраулар */}
                  {outgoingFriendRequests.length > 0 && (
                    <>
                      {friendRequests.length > 0 && outgoingFriendRequests.length > 0 && (
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
                <div 
                  className="chat-messages-friend"
                  onClick={() => navigate(`/profile?userId=${selectedFriend.id}`)}
                  style={{ cursor: 'pointer' }}
                >
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
                  // Parse image and audio from message content
                  const imageMatch = message.content.match(/\[IMAGE:(.+?)\]/);
                  const imageData = imageMatch ? imageMatch[1] : null;
                  const audioMatch = message.content.match(/\[AUDIO:(.+?)\]/);
                  const audioData = audioMatch ? audioMatch[1] : null;
                  const textContent = message.content.replace(/\[IMAGE:.+?\]/g, '').replace(/\[AUDIO:.+?\]/g, '').trim();
                  
                  return (
                    <div
                      key={message.id}
                      className={`chat-message ${isOwn ? 'own' : 'other'}`}
                    >
                      <div className={`chat-message-content ${imageData ? 'has-image' : ''} ${audioData ? 'has-audio' : ''}`}>
                        {imageData && (
                          <div className="chat-message-image">
                            <img src={imageData} alt="Sent image" />
                            <div className="chat-image-actions">
                              <button
                                className="chat-image-action-btn"
                                onClick={() => handleSaveImage(imageData)}
                                title="Сақтау"
                              >
                                <FontAwesomeIcon icon={faDownload} />
                              </button>
                              <button
                                className="chat-image-action-btn"
                                onClick={() => handleForwardImage(imageData)}
                                title="Басқа досқа жіберу"
                              >
                                <FontAwesomeIcon icon={faShare} />
                              </button>
                            </div>
                          </div>
                        )}
                        {audioData && (
                          <AudioPlayer 
                            messageId={message.id}
                            audioData={audioData}
                            isPlaying={playingAudioId === message.id}
                            onTogglePlay={() => toggleAudioPlay(message.id, audioData)}
                            audioRef={(ref) => {
                              audioRefs.current[message.id] = ref;
                            }}
                          />
                        )}
                        {textContent && <div>{textContent}</div>}
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
              <form className="chat-input-form" onSubmit={handleSendMessage}>
                {imagePreview && (
                  <div className="chat-image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedImage(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="chat-remove-image-btn"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                )}
                {audioPreview && (
                  <div className="chat-audio-preview">
                    <audio controls src={audioPreview} style={{ maxWidth: '300px' }} />
                    <button
                      type="button"
                      onClick={() => {
                        setAudioPreview(null);
                        setSelectedAudio(null);
                        if (audioInputRef.current) {
                          audioInputRef.current.value = '';
                        }
                        if (isRecording) {
                          stopRecording();
                        }
                      }}
                      className="chat-remove-audio-btn"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  <input
                    type="file"
                    ref={audioInputRef}
                    accept="audio/*"
                    onChange={handleAudioSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="chat-image-btn"
                    title="Сурет жіберу"
                  >
                    <FontAwesomeIcon icon={faImage} />
                  </button>
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Хабарлама жазыңыз..."
                    value={newMessage}
                    onChange={(e) => handleTypingChange(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        if (isRecording) {
                          stopRecording();
                        } else {
                          await startRecording();
                        }
                      }}
                      className={`chat-audio-btn ${isRecording ? 'recording' : ''}`}
                      title={isRecording ? 'Жазуды тоқтату' : 'Аудио сөйлеп жіберу'}
                    >
                      <FontAwesomeIcon icon={faMicrophone} />
                    </button>
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="chat-audio-file-btn"
                      title="Аудио файл жіберу"
                    >
                      <FontAwesomeIcon icon={faFile} />
                    </button>
                  </div>
                  <button type="submit" className="chat-send-btn" disabled={!newMessage.trim() && !selectedImage && !selectedAudio} title="Жіберу">
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </div>
              </form>
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
