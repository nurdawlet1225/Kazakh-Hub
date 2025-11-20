import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faSearch, faTimes, faUserMinus, faUserPlus, faClock, faCheck } from '@fortawesome/free-solid-svg-icons';
import { User, Message, FriendRequest } from '../utils/api';
import { apiService } from '../utils/api';
import '../components/Chat.css';

interface FriendWithLastMessage extends User {
  lastMessage?: Message;
  unreadCount?: number;
}

const ChatPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<FriendWithLastMessage[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'add' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [searching, setSearching] = useState(false);
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!currentUser) return;
    
    if (activeTab === 'requests') {
      // Load immediately
      loadFriendRequests();
      // Then set up interval
      const interval = setInterval(loadFriendRequests, 5000);
      return () => clearInterval(interval);
    } else if (activeTab === 'add') {
      // Load outgoing and incoming requests for status checking
      loadOutgoingRequests();
      loadFriendRequests();
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (currentUser && selectedFriend) {
      loadMessages();
      // Auto-refresh messages every 3 seconds
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUser, selectedFriend]);

  useEffect(() => {
    if (!currentUser) return;
    
    // Auto-refresh friends list every 5 seconds to update last messages
    // Only if we're on the friends tab to avoid unnecessary requests
    if (activeTab === 'friends') {
      const interval = setInterval(loadFriends, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
      
      // Load last message and unread count for each friend
      const friendsWithMessages = await Promise.all(
        friendsList.map(async (friend) => {
          try {
            const conversationMessages = await apiService.getConversation(
              currentUser.id,
              friend.id
            );
            
            const lastMessage = conversationMessages.length > 0 
              ? conversationMessages[conversationMessages.length - 1]
              : undefined;
            
            const unreadCount = conversationMessages.filter(
              msg => msg.toUserId === currentUser.id && !msg.read
            ).length;
            
            return {
              ...friend,
              lastMessage,
              unreadCount
            };
          } catch (err) {
            console.error(`Failed to load messages for friend ${friend.id}:`, err);
            return {
              ...friend,
              lastMessage: undefined,
              unreadCount: 0
            };
          }
        })
      );
      
      // Sort by last message time (most recent first)
      friendsWithMessages.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      });
      
      setFriends(friendsWithMessages);
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
      
      // Mark unread messages as read
      const unreadMessages = conversationMessages.filter(
        msg => msg.toUserId === currentUser.id && !msg.read
      );
      
      if (unreadMessages.length > 0) {
        // Mark messages as read (in a real app, you'd batch this)
        Promise.all(
          unreadMessages.map(msg => 
            apiService.markMessageAsRead(msg.id).catch(err => 
              console.error('Failed to mark message as read:', err)
            )
          )
        );
        
        // Reload friends to update unread counts
        loadFriends();
      }
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

  const loadOutgoingRequests = async () => {
    if (!currentUser) return;
    try {
      const allRequests = await apiService.getFriendRequests(currentUser.id);
      // Filter outgoing requests (where fromUserId is current user)
      const outgoing = allRequests.filter(req => {
        // Check if this is an outgoing request (not incoming)
        return req.fromUserId === currentUser.id && req.status === 'pending' && !req.isIncoming;
      });
      setOutgoingRequests(outgoing);
    } catch (err) {
      console.error('Failed to load outgoing requests:', err);
      // If error, set empty array
      setOutgoingRequests([]);
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (!currentUser) {
      setSearchResults([]);
      return;
    }
    
    const trimmedQuery = query.trim();
    
    // If query is empty, clear results
    if (!trimmedQuery) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    
    // Minimum 1 character to search
    if (trimmedQuery.length < 1) {
      return;
    }
    
    try {
      setSearching(true);
      const results = await apiService.searchUsers(trimmedQuery);
      
      // Filter out current user and existing friends
      const filtered = results.filter(
        user => user.id !== currentUser.id && !friends.some(f => f.id === user.id)
      );
      
      setSearchResults(filtered);
      
      // Reload outgoing and incoming requests to check status
      await loadOutgoingRequests();
      await loadFriendRequests();
    } catch (err: any) {
      console.error('Failed to search users:', err);
      setSearchResults([]);
      // Show error message to user
      const errorMsg = err.message || 'Іздеу қатесі';
      if (!errorMsg.includes('Failed to fetch') && !errorMsg.includes('NetworkError')) {
        console.error('Search error:', errorMsg);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (toUserId: string) => {
    if (!currentUser) return;
    try {
      await apiService.sendFriendRequest(currentUser.id, toUserId);
      // Reload outgoing requests to update status
      await loadOutgoingRequests();
      // Also reload friends list in case request was accepted immediately
      await loadFriends();
      alert('Достық сұрауы жіберілді');
    } catch (err: any) {
      console.error('Failed to send friend request:', err);
      const errorMsg = err.message || 'Достық сұрауы жіберу қатесі';
      if (errorMsg.includes('already exists') || errorMsg.includes('уже существует') || errorMsg.includes('already')) {
        // If request already exists, reload to show correct status
        await loadOutgoingRequests();
        alert('Достық сұрауы қазірдің өзінде жіберілген');
      } else if (errorMsg.includes('Already friends')) {
        // If already friends, reload friends list
        await loadFriends();
        alert('Сіз бұл пайдаланушымен қазірдің өзінде доссыз');
      } else {
        alert(errorMsg);
      }
    }
  };

  const getRequestStatus = (userId: string): 'none' | 'pending' | 'sent' => {
    // Check if we sent a request to this user
    const outgoing = outgoingRequests.find(req => req.toUserId === userId);
    if (outgoing) return 'sent';
    
    // Check if this user sent a request to us
    const incoming = friendRequests.find(req => req.fromUserId === userId);
    if (incoming) return 'pending';
    
    return 'none';
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

  const handleRemoveFriend = async (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the friend
    if (!currentUser) return;
    
    if (!window.confirm('Бұл досыңызды тізімнен алып тастағыңыз келе ме?')) {
      return;
    }
    
    try {
      await apiService.removeFriend(currentUser.id, friendId);
      await loadFriends();
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

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(friendsSearchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(friendsSearchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Қазір';
    if (minutes < 60) return `${minutes} мин бұрын`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} сағ бұрын`;
    
    return date.toLocaleDateString('kk-KZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
              ) : filteredFriends.length === 0 ? (
                <div className="chat-empty">
                  {friendsSearchQuery ? 'Дос табылмады' : 'Достар тізімі бос'}
                </div>
              ) : (
                <div className="chat-friends-items">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className={`chat-friend-item ${selectedFriend?.id === friend.id ? 'active' : ''} ${friend.unreadCount && friend.unreadCount > 0 ? 'has-unread' : ''}`}
                      onClick={() => setSelectedFriend(friend)}
                    >
                      <div className="chat-friend-avatar">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.username} />
                        ) : (
                          <span>{friend.username.charAt(0).toUpperCase()}</span>
                        )}
                        {friend.unreadCount && friend.unreadCount > 0 && (
                          <span className="chat-unread-badge">{friend.unreadCount > 99 ? '99+' : friend.unreadCount}</span>
                        )}
                      </div>
                      <div className="chat-friend-info">
                        <div className="chat-friend-header">
                          <div className="chat-friend-name">{friend.username}</div>
                          {friend.lastMessage && (
                            <div className="chat-friend-time">
                              {formatTime(friend.lastMessage.createdAt)}
                            </div>
                          )}
                        </div>
                        {friend.lastMessage && (
                          <div className="chat-friend-last-message">
                            {friend.lastMessage.fromUserId === currentUser?.id ? 'Сіз: ' : ''}
                            {friend.lastMessage.content.length > 40 
                              ? friend.lastMessage.content.substring(0, 40) + '...'
                              : friend.lastMessage.content}
                          </div>
                        )}
                      </div>
                      <button
                        className="chat-remove-friend-btn"
                        onClick={(e) => handleRemoveFriend(friend.id, e)}
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
                      
                      // Clear previous timeout
                      if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current);
                      }
                      
                      // If empty, clear immediately
                      if (!value.trim()) {
                        setSearchResults([]);
                        setSearching(false);
                        return;
                      }
                      
                      // Debounce search - wait 500ms after user stops typing
                      searchTimeoutRef.current = setTimeout(() => {
                        handleSearchUsers(value);
                      }, 500);
                    }}
                    onKeyDown={(e) => {
                      // If Enter is pressed, search immediately
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
                    const requestStatus = getRequestStatus(user.id);
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
                        {requestStatus === 'sent' ? (
                          <button
                            className="chat-add-btn chat-add-btn-pending"
                            disabled
                            title="Сұрау жіберілген"
                          >
                            <FontAwesomeIcon icon={faCheck} className="chat-btn-icon" />
                            Жіберілді
                          </button>
                        ) : requestStatus === 'pending' ? (
                          <button
                            className="chat-add-btn chat-add-btn-pending"
                            disabled
                            title="Сізге сұрау жіберілген - Сұраулар табында қараңыз"
                          >
                            <FontAwesomeIcon icon={faClock} className="chat-btn-icon" />
                            Күтуде
                          </button>
                        ) : (
                          <button
                            className="chat-add-btn"
                            onClick={() => handleSendFriendRequest(user.id)}
                            title="Достық сұрауы жіберу"
                          >
                            <FontAwesomeIcon icon={faUserPlus} className="chat-btn-icon" />
                            Қосу
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

export default ChatPage;


