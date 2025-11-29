import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faUserPlus, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { User, Message, FriendRequest } from '../utils/api';
import { apiService } from '../utils/api';
import { formatDateTime } from '../utils/dateFormatter';
import { ensureNumericId, isNumericId } from '../utils/idConverter';
import { subscribeToMessages, unsubscribe } from '../utils/realtimeService';
import './Chat.css';

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const Chat: React.FC<ChatProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'add' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadFriends();
      loadFriendRequests();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && activeTab === 'requests') {
      loadFriendRequests();
      const interval = setInterval(loadFriendRequests, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (currentUser && selectedFriend) {
      // Алдымен бір рет жүктеу
      loadMessages();
      
      // Real-time listener қосу
      const unsubscribeListener = subscribeToMessages(
        currentUser.id,
        selectedFriend.id,
        (updatedMessages) => {
          setMessages(updatedMessages);
        },
        (error) => {
          console.error('Real-time messages listener error:', error);
          // Егер real-time жұмыс істемесе, қалыпты жолмен жүктеу
          loadMessages();
        }
      );
      
      return () => {
        unsubscribeListener();
        unsubscribe(`messages-${currentUser.id}-${selectedFriend.id}`);
      };
    }
  }, [currentUser, selectedFriend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const loadFriends = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const friendsList = await apiService.getFriends(currentUser.id);
      setFriends(friendsList);
    } catch (err) {
      console.error('Failed to load friends:', err);
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
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !selectedFriend) return;

    try {
      await apiService.sendMessage(
        currentUser.id,
        selectedFriend.id,
        newMessage
      );
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Хабарлама жіберу қатесі');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadFriendRequests = async () => {
    if (!currentUser) return;
    try {
      const requests = await apiService.getIncomingFriendRequests(currentUser.id);
      setFriendRequests(requests);
    } catch (err) {
      console.error('Failed to load friend requests:', err);
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
            if (!friends.some(f => f.id === user.id)) {
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
      const filtered = results.filter(
        user => user.id !== currentUser.id && !friends.some(f => f.id === user.id)
      );
      
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
    try {
      await apiService.sendFriendRequest(currentUser.id, toUserId);
      setSearchQuery('');
      setSearchResults([]);
      alert('Достық сұрауы жіберілді');
    } catch (err: any) {
      console.error('Failed to send friend request:', err);
      alert(err.message || 'Достық сұрауы жіберу қатесі');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await apiService.acceptFriendRequest(requestId);
      await loadFriendRequests();
      await loadFriends();
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
      alert('Достық сұрауы бас тартылды');
    } catch (err) {
      console.error('Failed to reject friend request:', err);
      alert('Достық сұрауы бас тарту қатесі');
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

  if (!isOpen) return null;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3><FontAwesomeIcon icon={faComment} /> Чат</h3>
        <button className="chat-close-btn" onClick={onClose}>×</button>
      </div>

      <div className="chat-content">
        <div className="chat-friends-list">
          <div className="chat-tabs">
            <button
              className={`chat-tab ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              Достар ({friends.length})
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
              {loading ? (
                <div className="chat-loading">Жүктелуде...</div>
              ) : friends.length === 0 ? (
                <div className="chat-empty">Достар тізімі бос</div>
              ) : (
                <div className="chat-friends-items">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className={`chat-friend-item ${selectedFriend?.id === friend.id ? 'active' : ''}`}
                      onClick={() => setSelectedFriend(friend)}
                    >
                      <div className="chat-friend-avatar">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.username} />
                        ) : (
                          <span>{friend.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="chat-friend-info">
                        <div className="chat-friend-name">{friend.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'add' && (
            <div className="chat-add-friends">
              <div className="chat-search-box">
                <input
                  type="text"
                  className="chat-search-input"
                  placeholder="Пайдаланушыны іздеу (аты, email немесе ID)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearchUsers(e.target.value);
                  }}
                />
              </div>
              {searching ? (
                <div className="chat-loading">Ізделуде...</div>
              ) : searchResults.length === 0 && searchQuery ? (
                <div className="chat-empty">Пайдаланушы табылмады</div>
              ) : (
                <div className="chat-search-results">
                  {searchResults.map((user) => (
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
                      <button
                        className="chat-add-btn"
                        onClick={() => handleSendFriendRequest(user.id)}
                        title="Достық сұрауы жіберу"
                      >
                        <FontAwesomeIcon icon={faUserPlus} className="chat-btn-icon" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="chat-requests">
              {friendRequests.length === 0 ? (
                <div className="chat-empty">Сұраулар жоқ</div>
              ) : (
                <div className="chat-requests-items">
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
                </div>
              </div>
              <div className="chat-messages-list" ref={messagesContainerRef}>
                {messages.map((message) => {
                  const isOwn = message.fromUserId === currentUser?.id;
                  return (
                    <div
                      key={message.id}
                      className={`chat-message ${isOwn ? 'own' : 'other'}`}
                    >
                      <div className="chat-message-content">
                        {message.content}
                      </div>
                      <div className="chat-message-time">
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Хабарлама жазыңыз..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
                  Жіберу
                </button>
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

export default Chat;

