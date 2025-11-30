import { API_BASE_URL } from './constants';

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  replies?: Comment[]; // Replies to this comment
  likes?: string[]; // Array of user IDs who liked
  parentId?: string; // ID of parent comment if this is a reply
}

export interface CodeFile {
  id: string;
  title: string;
  content: string;
  language: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  description?: string;
  likes?: string[]; // Array of user IDs who liked
  comments?: Comment[];
  folderId?: string; // ID of parent folder if this is a file in a folder
  folderPath?: string; // Path within folder (e.g., "src/components/Header.tsx")
  isFolder?: boolean; // True if this is a folder container
  folderStructure?: Record<string, { type: 'file' | 'folder'; name: string; size?: number; language?: string }>; // Folder structure
  views?: number; // Total number of views
  viewedBy?: string[]; // Array of user IDs who viewed this code
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
  read: boolean;
  status?: 'sent' | 'delivered' | 'read';
  readAt?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  otherUser?: User;
  fromUser?: User;
  toUser?: User;
  isIncoming?: boolean;
}

export interface Chat {
  partnerId: string;
  partner: User;
  lastMessage: Message;
  unreadCount: number;
  lastMessageTime: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`API Request: ${options?.method || 'GET'} ${url}`);
      
      // Add timeout to prevent hanging (10 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        
        // Only log non-401 errors or if it's not a login endpoint
        // 401 errors during login are expected (will try Firebase)
        const isLoginEndpoint = endpoint.includes('/auth/login');
        const isExpected401 = response.status === 401 && isLoginEndpoint;
        
        // Don't log 404 errors for getUserProfile - this is expected when searching by ID
        const isUserProfileEndpoint = endpoint.match(/^\/users\/[^\/]+$/);
        const isExpected404 = response.status === 404 && isUserProfileEndpoint;
        
        if (!isExpected401 && !isExpected404) {
          console.error(`API Error: ${response.status} ${response.statusText}`, errorData);
        }
        
        let errorMessage = errorData.detail || errorData.error || `API Error: ${response.statusText}`;
        
        // Translate common error messages to Kazakh
        if (errorMessage.includes('Invalid credentials') || errorMessage.includes('User not found')) {
          errorMessage = 'Пайдаланушы табылмады немесе құпия сөз дұрыс емес';
        } else if (errorMessage.includes('Something went wrong')) {
          errorMessage = 'Қате орын алды! Сервер қатесі.';
        } else if (response.status === 401) {
          errorMessage = 'Кіру рұқсаты жоқ. Электрондық пошта немесе құпия сөзді тексеріңіз.';
        } else if (response.status === 404) {
          errorMessage = 'Пайдаланушы табылмады.';
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's an abort error (timeout)
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          throw new Error('Серверге қосылу уақыты асқынып кетті. Интернет байланысын тексеріңіз.');
        }
        // Network error or other fetch errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Серверге қосылу мүмкін емес. Backend-тің http://127.0.0.1:3000-де жұмыс істеп тұрғанын тексеріңіз');
        }
        throw error;
      }
      throw new Error('Белгісіз қате орын алды');
    }
  }

  // Code files
  async getCodeFiles(
    folderId?: string, 
    limit?: number, 
    offset?: number, 
    includeContent?: boolean
  ): Promise<{ codes: CodeFile[]; total: number; limit?: number; offset: number; hasMore: boolean }> {
    const params = new URLSearchParams();
    if (folderId) params.append('folderId', folderId);
    if (limit !== undefined) params.append('limit', limit.toString());
    if (offset !== undefined) params.append('offset', offset.toString());
    if (includeContent) params.append('includeContent', 'true');
    
    const endpoint = `/codes${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.request<any>(endpoint);
    
    // Кері үйлесімділік: егер жауап массив болса (ескі формат), оны жаңа форматқа түрлендіру
    if (Array.isArray(response)) {
      return {
        codes: response,
        total: response.length,
        limit: limit,
        offset: offset || 0,
        hasMore: false
      };
    }
    
    // Жаңа формат (пагинациямен)
    return response;
  }

  async getCodeFile(id: string): Promise<CodeFile> {
    return this.request<CodeFile>(`/codes/${id}`);
  }

  async createCodeFile(file: Omit<CodeFile, 'id' | 'createdAt' | 'updatedAt'>): Promise<CodeFile> {
    return this.request<CodeFile>('/codes', {
      method: 'POST',
      body: JSON.stringify(file),
    });
  }

  async updateCodeFile(id: string, file: Partial<CodeFile>): Promise<CodeFile> {
    return this.request<CodeFile>(`/codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(file),
    });
  }

  async deleteCodeFile(id: string): Promise<void> {
    return this.request<void>(`/codes/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteMultipleCodes(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    return this.request<{ message: string; deletedCount: number }>('/codes/delete-multiple', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // User
  async getCurrentUser(email?: string, userId?: string): Promise<User> {
    // Try to get email and userId from localStorage if not provided
    if (!email || !userId) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          email = email || userData.email;
          userId = userId || userData.id;
        }
      } catch (err) {
        console.error('Failed to get user data from localStorage:', err);
      }
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (userId) params.append('user_id', userId);
    
    const url = params.toString() ? `/user?${params.toString()}` : '/user';
    
    try {
      return await this.request<User>(url);
    } catch (error: any) {
      // If user not found (404), clear localStorage and reload
      if (error?.message?.includes('404') || error?.message?.includes('not found') || error?.message?.includes('табылмады')) {
        console.warn('User not found in backend, clearing localStorage');
        localStorage.removeItem('user');
        // Only reload if we're not already handling the error elsewhere
        // Don't reload immediately to avoid infinite loops
        throw new Error('Пайдаланушы табылмады. Жүйені қайта жүктеңіз немесе қайта кіріңіз.');
      }
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  async updateUserProfile(updates: Partial<User>): Promise<User> {
    return this.request<User>('/user', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAccount(userId: string, email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/user', {
      method: 'DELETE',
      body: JSON.stringify({ userId, email }),
    });
  }

  // Authentication
  async register(username: string, email: string, password: string, firebaseUid?: string): Promise<{ user: User; message: string }> {
    return this.request<{ user: User; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, firebase_uid: firebaseUid }),
    });
  }

  async login(emailOrUsername: string, password: string): Promise<{ user: User; message: string }> {
    // Check if it's an email (contains @) or username
    const isEmail = emailOrUsername.includes('@');
    const body = isEmail 
      ? { email: emailOrUsername, password }
      : { username: emailOrUsername, password };
    
    try {
      return await this.request<{ user: User; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error: any) {
      // For email logins, backend errors are expected - Firebase will be tried
      // Only log if it's a username (can't try Firebase) or if it's a non-401 error
      if (!isEmail || (error.message && !error.message.includes('Пайдаланушы табылмады') && !error.message.includes('құпия сөз'))) {
        // Re-throw to let Login.tsx handle it
        throw error;
      }
      // For email 401 errors, silently re-throw - Firebase will be tried
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string | null, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    });
  }

  // Likes
  async likeCode(codeId: string, userId: string): Promise<CodeFile> {
    return this.request<CodeFile>(`/codes/${codeId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async unlikeCode(codeId: string, userId: string): Promise<CodeFile> {
    return this.request<CodeFile>(`/codes/${codeId}/unlike`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Comments
  async addComment(codeId: string, author: string, content: string): Promise<CodeFile> {
    return this.request<CodeFile>(`/codes/${codeId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ author, content }),
    });
  }

  async updateComment(codeId: string, commentId: string, content: string): Promise<CodeFile> {
    return this.request<CodeFile>(`/codes/${codeId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(codeId: string, commentId: string): Promise<CodeFile> {
    return this.request<CodeFile>(`/codes/${codeId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async addReply(codeId: string, parentId: string, author: string, content: string): Promise<CodeFile> {
    return this.request<CodeFile>(`/codes/${codeId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ author, content, parentId }),
    });
  }

  async likeComment(codeId: string, commentId: string, userId: string): Promise<CodeFile> {
    return this.request<CodeFile>(`/codes/${codeId}/comments/${commentId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }


  // Views
  async incrementView(codeId: string, userId: string | null): Promise<CodeFile> {
    return this.request<CodeFile>(`/codes/${codeId}/view`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Friends
  async getFriends(userId: string): Promise<User[]> {
    return this.request<User[]>(`/friends/${userId}`);
  }

  async addFriend(userId: string, friendId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/friends/${userId}/add`, {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
  }

  async removeFriend(userId: string, friendId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/friends/${userId}/remove/${friendId}`, {
      method: 'DELETE',
    });
  }

  // Messages
  async getMessages(userId: string): Promise<Message[]> {
    return this.request<Message[]>(`/messages/${userId}`);
  }

  async getConversation(userId: string, friendId: string): Promise<Message[]> {
    return this.request<Message[]>(`/messages/${userId}/${friendId}`);
  }

  async sendMessage(fromUserId: string, toUserId: string, content: string): Promise<Message> {
    return this.request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify({ fromUserId, toUserId, content }),
    });
  }

  async markMessageAsRead(messageId: string): Promise<Message> {
    return this.request<Message>(`/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  async markConversationRead(userId: string, friendId: string): Promise<{ message: string; count: number }> {
    return this.request<{ message: string; count: number }>(`/messages/${userId}/${friendId}/mark-read`, {
      method: 'PUT',
    });
  }

  async getUnreadCountForChat(userId: string, friendId: string): Promise<{ unreadCount: number; chatId: string }> {
    return this.request<{ unreadCount: number; chatId: string }>(`/messages/${userId}/${friendId}/unread-count`);
  }

  async getTotalUnreadCount(userId: string): Promise<{ totalUnreadCount: number }> {
    return this.request<{ totalUnreadCount: number }>(`/messages/${userId}/unread-count`);
  }

  async getChats(userId: string): Promise<Chat[]> {
    return this.request<Chat[]>(`/chats/${userId}`);
  }

  async getIncomingFriendRequestCount(userId: string): Promise<{ incomingRequestCount: number }> {
    return this.request<{ incomingRequestCount: number }>(`/friend-requests/${userId}/incoming-count`);
  }

  // Friend Requests
  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    return this.request<FriendRequest[]>(`/friend-requests/${userId}`);
  }

  async getIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
    return this.request<FriendRequest[]>(`/friend-requests/incoming/${userId}`);
  }

  async getOutgoingFriendRequests(userId: string): Promise<FriendRequest[]> {
    return this.request<FriendRequest[]>(`/friend-requests/outgoing/${userId}`);
  }

  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest> {
    return this.request<FriendRequest>('/friend-requests', {
      method: 'POST',
      body: JSON.stringify({ fromUserId, toUserId }),
    });
  }

  async acceptFriendRequest(requestId: string): Promise<{ message: string; request: FriendRequest }> {
    return this.request<{ message: string; request: FriendRequest }>(`/friend-requests/${requestId}/accept`, {
      method: 'PUT',
    });
  }

  async rejectFriendRequest(requestId: string): Promise<{ message: string; request: FriendRequest }> {
    return this.request<{ message: string; request: FriendRequest }>(`/friend-requests/${requestId}/reject`, {
      method: 'PUT',
    });
  }

  async cancelFriendRequest(requestId: string, userId: string): Promise<{ message: string; request: FriendRequest }> {
    return this.request<{ message: string; request: FriendRequest }>(`/friend-requests/${requestId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ userId }),
    });
  }

  // User Search - Using Backend API (Firebase fallback removed for reliability)
  async searchUsers(searchQuery: string): Promise<User[]> {
    const searchTerm = searchQuery.trim();
    if (!searchTerm || searchTerm.length < 1) {
      return [];
    }
    
    try {
      // Use backend API directly for reliable search
      return await this.request<User[]>(`/users/search?query=${encodeURIComponent(searchTerm)}`);
    } catch (error) {
      console.error('User search error:', error);
      // Return empty array on error
      return [];
    }
  }
}

export const apiService = new ApiService();