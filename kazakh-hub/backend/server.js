import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const CODES_FILE = path.join(DATA_DIR, 'codes.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PASSWORDS_FILE = path.join(DATA_DIR, 'passwords.json');
const FRIENDS_FILE = path.join(DATA_DIR, 'friends.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const FRIEND_REQUESTS_FILE = path.join(DATA_DIR, 'friendRequests.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from files
const loadData = () => {
  try {
    if (fs.existsSync(CODES_FILE)) {
      const codesData = fs.readFileSync(CODES_FILE, 'utf8');
      codes = JSON.parse(codesData);
    }
  } catch (err) {
    console.error('Error loading codes:', err);
    codes = [];
  }

  try {
    if (fs.existsSync(USERS_FILE)) {
      const usersData = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(usersData);
    } else {
      // Initialize with default user
      users = [
        {
          id: '1',
          username: 'current-user',
          email: 'user@example.com',
          avatar: null,
        },
      ];
      saveUsers();
    }
  } catch (err) {
    console.error('Error loading users:', err);
    users = [
      {
        id: '1',
        username: 'current-user',
        email: 'user@example.com',
        avatar: null,
      },
    ];
  }

  try {
    if (fs.existsSync(PASSWORDS_FILE)) {
      const passwordsData = fs.readFileSync(PASSWORDS_FILE, 'utf8');
      const passwordsObj = JSON.parse(passwordsData);
      passwords = new Map(Object.entries(passwordsObj));
    } else {
      passwords = new Map();
    }
  } catch (err) {
    console.error('Error loading passwords:', err);
    passwords = new Map();
  }

  try {
    if (fs.existsSync(FRIENDS_FILE)) {
      const friendsData = fs.readFileSync(FRIENDS_FILE, 'utf8');
      friends = JSON.parse(friendsData);
    } else {
      friends = {};
    }
  } catch (err) {
    console.error('Error loading friends:', err);
    friends = {};
  }

  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const messagesData = fs.readFileSync(MESSAGES_FILE, 'utf8');
      messages = JSON.parse(messagesData);
    } else {
      messages = [];
    }
  } catch (err) {
    console.error('Error loading messages:', err);
    messages = [];
  }

  try {
    if (fs.existsSync(FRIEND_REQUESTS_FILE)) {
      const requestsData = fs.readFileSync(FRIEND_REQUESTS_FILE, 'utf8');
      friendRequests = JSON.parse(requestsData);
    } else {
      friendRequests = [];
    }
  } catch (err) {
    console.error('Error loading friend requests:', err);
    friendRequests = [];
  }
};

// Save data to files
const saveCodes = () => {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Check if codes array is valid
    if (!Array.isArray(codes)) {
      throw new Error('Codes is not an array');
    }
    
    // Try to stringify with error handling
    let jsonData;
    try {
      jsonData = JSON.stringify(codes, null, 2);
    } catch (stringifyError) {
      console.error('JSON.stringify error:', stringifyError);
      console.error('Codes array length:', codes.length);
      // Try to identify which code might be causing the issue
      if (codes.length > 0) {
        console.error('Last code in array:', {
          id: codes[codes.length - 1]?.id,
          title: codes[codes.length - 1]?.title,
          contentLength: codes[codes.length - 1]?.content?.length
        });
      }
      throw new Error(`Failed to stringify codes: ${stringifyError.message}`);
    }
    
    // Write to file
    fs.writeFileSync(CODES_FILE, jsonData, 'utf8');
    console.log('Codes saved successfully, file size:', jsonData.length, 'bytes');
  } catch (err) {
    console.error('Error saving codes:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      path: CODES_FILE,
      codesCount: codes.length,
      dataDirExists: fs.existsSync(DATA_DIR)
    });
    throw err; // Re-throw to be caught by the endpoint handler
  }
};

const saveUsers = () => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving users:', err);
  }
};

const savePasswords = () => {
  try {
    const passwordsObj = Object.fromEntries(passwords);
    fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(passwordsObj, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving passwords:', err);
  }
};

const saveFriends = () => {
  try {
    fs.writeFileSync(FRIENDS_FILE, JSON.stringify(friends, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving friends:', err);
  }
};

const saveMessages = () => {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving messages:', err);
  }
};

const saveFriendRequests = () => {
  try {
    fs.writeFileSync(FRIEND_REQUESTS_FILE, JSON.stringify(friendRequests, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving friend requests:', err);
  }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' })); // Increase limit for large file uploads
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Load data on startup
let codes = [];
let users = [];
let passwords = new Map();
let friends = {}; // { userId: [friendId1, friendId2, ...] }
let messages = []; // [{ id, fromUserId, toUserId, content, createdAt, read }]
let friendRequests = []; // [{ id, fromUserId, toUserId, status: 'pending'|'accepted'|'rejected', createdAt }]
loadData();

// Helper function to find code by ID
const findCodeById = (id) => codes.find((code) => code.id === id);

// Helper function to find user by username
const findUserByUsername = (username) => users.find((user) => user.username === username);

// Routes

// Root endpoint - redirect to frontend or show info
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kazakh Hub Backend API',
    note: 'This is the backend server. Please use the frontend at http://localhost:5174',
    api: 'http://localhost:3000/api',
    frontend: 'http://localhost:5174'
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Kazakh Hub API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      codes: {
        getAll: 'GET /api/codes',
        getOne: 'GET /api/codes/:id',
        create: 'POST /api/codes',
        update: 'PUT /api/codes/:id',
        delete: 'DELETE /api/codes/:id'
      },
      users: {
        current: 'GET /api/user',
        profile: 'GET /api/users/:id'
      }
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Kazakh Hub API is running' });
});

// Get all code files
app.get('/api/codes', (req, res) => {
  const folderId = req.query.folderId;
  if (folderId) {
    // Get files in a specific folder
    const folderFiles = codes.filter(code => code.folderId === folderId);
    res.json(folderFiles);
  } else {
    // Get all codes (excluding files that belong to folders)
    const allCodes = codes.filter(code => !code.folderId);
    res.json(allCodes);
  }
});

// Get a single code file by ID
app.get('/api/codes/:id', (req, res) => {
  const code = findCodeById(req.params.id);
  if (!code) {
    return res.status(404).json({ error: 'Code file not found' });
  }
  res.json(code);
});

// File validation constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_CONTENT_LENGTH = 100 * 1024 * 1024; // 100MB for content string
const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.jar', '.app', '.deb', '.pkg', '.rpm', '.msi', '.dmg', '.sh', '.ps1', '.bin', '.dll', '.so', '.dylib', '.sys', '.drv', '.ocx', '.cpl', '.php', '.asp', '.aspx', '.jsp', '.class'];

// Validate file on server side
const validateFileOnServer = (title, content) => {
  // Check file extension
  const ext = title.toLowerCase().substring(title.lastIndexOf('.'));
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Қауіпті файл түрі блокталды: ${ext}` };
  }
  
  // Check content size
  if (content && content.length > MAX_CONTENT_LENGTH) {
    return { valid: false, error: `Файл өлшемі тым үлкен. Максималды өлшем: ${MAX_CONTENT_LENGTH / (1024 * 1024)}MB` };
  }
  
  // Check for potentially malicious content patterns
  const maliciousPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /exec\s*\(/gi,
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, error: 'Файлда қауіпті контент табылды' };
    }
  }
  
  return { valid: true };
};

// Create a new code file
app.post('/api/codes', (req, res) => {
  try {
    const { title, content, language, author, description, tags } = req.body;

    console.log('POST /api/codes - Request received:', {
      hasTitle: !!title,
      hasContent: !!content,
      contentLength: content ? content.length : 0,
      language,
      author,
      hasDescription: !!description,
      tagsCount: tags ? tags.length : 0
    });

    if (!title || !content || !language || !author) {
      console.log('POST /api/codes - Missing required fields:', {
        title: !!title,
        content: !!content,
        language: !!language,
        author: !!author
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate file on server side
    const validation = validateFileOnServer(title, content);
    if (!validation.valid) {
      console.log('POST /api/codes - Validation failed:', validation.error);
      return res.status(400).json({ error: validation.error });
    }

    const newCode = {
      id: uuidv4(),
      title,
      content,
      language,
      author,
      description: description || null,
      tags: tags || [],
      likes: [],
      comments: [],
      folderId: req.body.folderId || null,
      folderPath: req.body.folderPath || null,
      isFolder: req.body.isFolder || false,
      folderStructure: req.body.folderStructure || null,
      views: 0,
      viewedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('POST /api/codes - Creating new code:', {
      id: newCode.id,
      title: newCode.title,
      language: newCode.language,
      author: newCode.author
    });

    codes.push(newCode);
    
    console.log('POST /api/codes - Saving codes, total codes:', codes.length);
    saveCodes();
    
    console.log('POST /api/codes - Success, returning new code');
    res.status(201).json(newCode);
  } catch (error) {
    console.error('POST /api/codes - Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Қате орын алды! Сервер қатесі.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a code file
app.put('/api/codes/:id', (req, res) => {
  const code = findCodeById(req.params.id);
  if (!code) {
    return res.status(404).json({ error: 'Code file not found' });
  }

  const { title, content, language, description, tags } = req.body;

  if (title) code.title = title;
  if (content) code.content = content;
  if (language) code.language = language;
  if (description !== undefined) code.description = description;
  if (tags) code.tags = tags;
  code.updatedAt = new Date().toISOString();

  saveCodes();
  res.json(code);
});

// Delete a code file
app.delete('/api/codes/:id', (req, res) => {
  const codeId = req.params.id;
  const code = findCodeById(codeId);
  
  if (!code) {
    return res.status(404).json({ error: 'Code file not found' });
  }

  // If it's a folder, delete all files in the folder first
  if (code.isFolder) {
    const folderFiles = codes.filter(c => c.folderId === codeId);
    folderFiles.forEach(file => {
      const fileIndex = codes.findIndex(c => c.id === file.id);
      if (fileIndex !== -1) {
        codes.splice(fileIndex, 1);
      }
    });
  }

  // Delete the code itself
  const index = codes.findIndex((code) => code.id === codeId);
  if (index !== -1) {
    codes.splice(index, 1);
  }

  saveCodes();
  res.status(204).send();
});

// Delete multiple codes
app.post('/api/codes/delete-multiple', (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'IDs array required' });
  }

  let deletedCount = 0;
  const codesToDelete = codes.filter(c => ids.includes(c.id));
  
  // First, delete all files in folders that are being deleted
  codesToDelete.forEach(code => {
    if (code.isFolder) {
      const folderFiles = codes.filter(c => c.folderId === code.id);
      folderFiles.forEach(file => {
        const fileIndex = codes.findIndex(c => c.id === file.id);
        if (fileIndex !== -1) {
          codes.splice(fileIndex, 1);
          deletedCount++;
        }
      });
    }
  });

  // Then delete the codes themselves
  ids.forEach(id => {
    const index = codes.findIndex(c => c.id === id);
    if (index !== -1) {
      codes.splice(index, 1);
      deletedCount++;
    }
  });

  saveCodes();
  res.json({ message: `${deletedCount} код(тар) жойылды`, deletedCount });
});

// Like a code file
app.post('/api/codes/:id/like', (req, res) => {
  const code = findCodeById(req.params.id);
  if (!code) {
    return res.status(404).json({ error: 'Code file not found' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  if (!code.likes) {
    code.likes = [];
  }

  if (!code.likes.includes(userId)) {
    code.likes.push(userId);
    code.updatedAt = new Date().toISOString();
    saveCodes();
  }

  res.json(code);
});

// Unlike a code file
app.post('/api/codes/:id/unlike', (req, res) => {
  const code = findCodeById(req.params.id);
  if (!code) {
    return res.status(404).json({ error: 'Code file not found' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  if (!code.likes) {
    code.likes = [];
  }

  code.likes = code.likes.filter(id => id !== userId);
  code.updatedAt = new Date().toISOString();
  saveCodes();

  res.json(code);
});

// Increment view count for a code file
app.post('/api/codes/:id/view', (req, res) => {
  const code = findCodeById(req.params.id);
  if (!code) {
    return res.status(404).json({ error: 'Code file not found' });
  }

  const { userId } = req.body;

  // Initialize views and viewedBy if they don't exist
  if (typeof code.views === 'undefined') {
    code.views = 0;
  }
  if (!code.viewedBy) {
    code.viewedBy = [];
  }

  // If userId is provided, check if user already viewed
  if (userId) {
    if (!code.viewedBy.includes(userId)) {
      code.viewedBy.push(userId);
      code.views = (code.views || 0) + 1;
      code.updatedAt = new Date().toISOString();
      saveCodes();
    }
  } else {
    // If no userId (anonymous), just increment views
    code.views = (code.views || 0) + 1;
    code.updatedAt = new Date().toISOString();
    saveCodes();
  }

  res.json(code);
});

// Add a comment to a code file
app.post('/api/codes/:id/comments', (req, res) => {
  const code = findCodeById(req.params.id);
  if (!code) {
    return res.status(404).json({ error: 'Code file not found' });
  }

  const { author, content } = req.body;
  if (!author || !content) {
    return res.status(400).json({ error: 'Author and content required' });
  }

  if (!code.comments) {
    code.comments = [];
  }

  const newComment = {
    id: uuidv4(),
    author,
    content,
    createdAt: new Date().toISOString(),
    replies: [],
    likes: [],
    dislikes: [],
    parentId: req.body.parentId || null,
  };

  code.comments.push(newComment);
  code.updatedAt = new Date().toISOString();
  saveCodes();

  res.json(code);
});

// Update a comment
app.put('/api/codes/:id/comments/:commentId', (req, res) => {
  const code = findCodeById(req.params.id);
  if (!code) {
    return res.status(404).json({ error: 'Code file not found' });
  }

  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content required' });
  }

  if (!code.comments) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const comment = code.comments.find(c => c.id === req.params.commentId);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  comment.content = content;
  code.updatedAt = new Date().toISOString();
  saveCodes();

  res.json(code);
});

// Delete a comment
app.delete('/api/codes/:id/comments/:commentId', (req, res) => {
  const code = findCodeById(req.params.id);
  if (!code) {
    return res.status(404).json({ error: 'Code file not found' });
  }

  if (!code.comments) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const commentIndex = code.comments.findIndex(c => c.id === req.params.commentId);
  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  code.comments.splice(commentIndex, 1);
  code.updatedAt = new Date().toISOString();
  saveCodes();

  res.json(code);
});

// Like a comment
app.post('/api/codes/:id/comments/:commentId/like', (req, res) => {
  const code = findCodeById(req.params.id);
  if (!code || !code.comments) {
    return res.status(404).json({ error: 'Code file or comment not found' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const comment = code.comments.find(c => c.id === req.params.commentId);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (!comment.likes) comment.likes = [];
  if (!comment.dislikes) comment.dislikes = [];

  // Remove from dislikes if exists
  comment.dislikes = comment.dislikes.filter(id => id !== userId);

  // Toggle like
  if (comment.likes.includes(userId)) {
    comment.likes = comment.likes.filter(id => id !== userId);
  } else {
    comment.likes.push(userId);
  }

  code.updatedAt = new Date().toISOString();
  saveCodes();
  res.json(code);
});

// Dislike a comment
app.post('/api/codes/:id/comments/:commentId/dislike', (req, res) => {
  const code = findCodeById(req.params.id);
  if (!code || !code.comments) {
    return res.status(404).json({ error: 'Code file or comment not found' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const comment = code.comments.find(c => c.id === req.params.commentId);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (!comment.likes) comment.likes = [];
  if (!comment.dislikes) comment.dislikes = [];

  // Remove from likes if exists
  comment.likes = comment.likes.filter(id => id !== userId);

  // Toggle dislike
  if (comment.dislikes.includes(userId)) {
    comment.dislikes = comment.dislikes.filter(id => id !== userId);
  } else {
    comment.dislikes.push(userId);
  }

  code.updatedAt = new Date().toISOString();
  saveCodes();
  res.json(code);
});

// Authentication endpoints
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if user already exists
  if (users.find(u => u.email === email || u.username === username)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser = {
    id: uuidv4(),
    username,
    email,
    avatar: null,
  };

  users.push(newUser);
  passwords.set(email, password); // In real app, hash the password
  saveUsers();
  savePasswords();
  res.status(201).json({ user: newUser, message: 'User registered successfully' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, username, password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  if (!email && !username) {
    return res.status(400).json({ error: 'Email or username required' });
  }

  // In a real app, verify password hash
  // Try to find user by email or username
  let user = null;
  let storedPassword = null;
  
  if (email) {
    user = users.find(u => u.email === email);
    if (user) {
      storedPassword = passwords.get(email);
    }
  } else if (username) {
    user = users.find(u => u.username === username);
    if (user) {
      storedPassword = passwords.get(user.email);
    }
  }
  
  if (!user || storedPassword !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ user, message: 'Login successful' });
});

// Get current user
app.get('/api/user', (req, res) => {
  // In a real app, this would get the user from the authentication token
  // For now, try to get 'current-user' or first user
  let user = findUserByUsername('current-user');
  if (!user && users.length > 0) {
    user = users[0];
  }
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Get user profile by ID
app.get('/api/users/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Change password
app.post('/api/auth/change-password', (req, res) => {
  const { userId, email, currentPassword, newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'New password required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  // Find user
  let user = null;
  if (userId) {
    user = users.find((u) => u.id === userId);
  } else if (email) {
    user = users.find((u) => u.email === email);
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify current password if provided
  if (currentPassword) {
    const storedPassword = passwords.get(user.email);
    if (storedPassword !== currentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
  }

  // Update password
  passwords.set(user.email, newPassword);
  savePasswords();

  res.json({ message: 'Password changed successfully' });
});

// Update user profile
app.put('/api/user', (req, res) => {
  try {
    // In a real app, this would get the user from the authentication token
    const { username, email, avatar, userId, currentEmail } = req.body;
    
    let user;
    
    // First try to find by userId if provided (most reliable)
    if (userId) {
      user = users.find((u) => u.id === userId);
      console.log('Finding user by ID:', userId, user ? 'found' : 'not found');
    }
    
    // If not found by ID, try to find by current email (before update)
    // This is important because email might be changed in the same request
    if (!user && currentEmail) {
      user = users.find((u) => u.email === currentEmail);
      console.log('Finding user by current email:', currentEmail, user ? 'found' : 'not found');
    }
    
    // If still not found, try by new email (in case email wasn't changed)
    if (!user && email) {
      user = users.find((u) => u.email === email);
      console.log('Finding user by new email:', email, user ? 'found' : 'not found');
    }
    
    // If still not found, try by username
    if (!user && username) {
      user = findUserByUsername(username);
      console.log('Finding user by username:', username, user ? 'found' : 'not found');
    }
    
    // Fallback: try to get by 'current-user' or get first user
    if (!user) {
      user = findUserByUsername('current-user') || (users.length > 0 ? users[0] : null);
      console.log('Using fallback user:', user ? user.id : 'none');
    }
    
    if (!user) {
      console.error('User not found. Available users:', users.map(u => ({ id: u.id, username: u.username, email: u.email })));
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Updating user profile:', { 
      userId: user.id,
      currentUsername: user.username, 
      currentEmail: user.email,
      newUsername: username, 
      newEmail: email, 
      avatar: avatar ? 'base64 image (length: ' + avatar.length + ' bytes)' : 'null' 
    });

    // Validate and update username
    if (username !== undefined && username.trim() !== '') {
      user.username = username.trim();
    }
    
    // Validate and update email
    if (email !== undefined && email.trim() !== '') {
      // Check if email is already taken by another user
      const emailTaken = users.find(u => u.id !== user.id && u.email === email.trim());
      if (emailTaken) {
        return res.status(400).json({ error: 'Email already in use by another user' });
      }
      user.email = email.trim();
    }
    
    // Update avatar
    if (avatar !== undefined) {
      if (avatar === null || avatar === '') {
        user.avatar = null;
      } else {
        // Validate base64 string
        if (typeof avatar === 'string' && avatar.startsWith('data:image')) {
          user.avatar = avatar;
        } else {
          return res.status(400).json({ error: 'Invalid avatar format' });
        }
      }
    }

    saveUsers();
    console.log('User profile updated successfully:', { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      hasAvatar: !!user.avatar,
      avatarSize: user.avatar ? user.avatar.length + ' bytes' : 'none'
    });
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error while updating profile' });
  }
});

// Delete user account
app.delete('/api/user', (req, res) => {
  try {
    const { userId, email } = req.body;
    
    // Find user
    let user = null;
    if (userId) {
      user = users.find((u) => u.id === userId);
    } else if (email) {
      user = users.find((u) => u.email === email);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userEmail = user.email;
    const userIdToDelete = user.id;
    
    // Delete user from users array
    users = users.filter((u) => u.id !== userIdToDelete);
    saveUsers();
    
    // Delete password
    passwords.delete(userEmail);
    savePasswords();
    
    // Delete user's codes
    codes = codes.filter((code) => code.author !== user.username);
    saveCodes();
    
    // Delete user from friends lists
    if (friends[userIdToDelete]) {
      delete friends[userIdToDelete];
    }
    // Remove user from other users' friends lists
    Object.keys(friends).forEach(friendUserId => {
      if (friends[friendUserId]) {
        friends[friendUserId] = friends[friendUserId].filter(id => id !== userIdToDelete);
      }
    });
    saveFriends();
    
    // Delete user's messages
    messages = messages.filter(
      (msg) => msg.fromUserId !== userIdToDelete && msg.toUserId !== userIdToDelete
    );
    saveMessages();
    
    // Delete friend requests involving this user
    friendRequests = friendRequests.filter(
      (req) => req.fromUserId !== userIdToDelete && req.toUserId !== userIdToDelete
    );
    saveFriendRequests();
    
    // Remove user from likes and comments in remaining codes
    codes.forEach(code => {
      if (code.likes) {
        code.likes = code.likes.filter(id => id !== userIdToDelete);
      }
      if (code.comments) {
        code.comments = code.comments.filter(comment => {
          // Remove user's likes from comments
          if (comment.likes) {
            comment.likes = comment.likes.filter(id => id !== userIdToDelete);
          }
          // Remove user's comments
          if (comment.author === user.username) {
            return false;
          }
          // Remove user's replies
          if (comment.replies) {
            comment.replies = comment.replies.filter(reply => reply.author !== user.username);
          }
          return true;
        });
      }
    });
    saveCodes();
    
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Internal server error while deleting account' });
  }
});

// Friends endpoints
app.get('/api/friends/:userId', (req, res) => {
  const { userId } = req.params;
  const userFriends = friends[userId] || [];
  const friendsList = userFriends.map(friendId => {
    const friend = users.find(u => u.id === friendId);
    return friend ? { id: friend.id, username: friend.username, email: friend.email, avatar: friend.avatar } : null;
  }).filter(Boolean);
  res.json(friendsList);
});

app.post('/api/friends/:userId/add', (req, res) => {
  const { userId } = req.params;
  const { friendId } = req.body;
  
  if (!friendId) {
    return res.status(400).json({ error: 'Friend ID is required' });
  }
  
  if (userId === friendId) {
    return res.status(400).json({ error: 'Cannot add yourself as a friend' });
  }
  
  if (!friends[userId]) {
    friends[userId] = [];
  }
  
  if (!friends[userId].includes(friendId)) {
    friends[userId].push(friendId);
    saveFriends();
  }
  
  // Add reverse friendship (bidirectional)
  if (!friends[friendId]) {
    friends[friendId] = [];
  }
  
  if (!friends[friendId].includes(userId)) {
    friends[friendId].push(userId);
    saveFriends();
  }
  
  res.json({ message: 'Friend added successfully' });
});

app.delete('/api/friends/:userId/remove/:friendId', (req, res) => {
  const { userId, friendId } = req.params;
  
  if (friends[userId]) {
    friends[userId] = friends[userId].filter(id => id !== friendId);
    saveFriends();
  }
  
  if (friends[friendId]) {
    friends[friendId] = friends[friendId].filter(id => id !== userId);
    saveFriends();
  }
  
  res.json({ message: 'Friend removed successfully' });
});

// Messages endpoints
app.get('/api/messages/:userId', (req, res) => {
  const { userId } = req.params;
  const userMessages = messages.filter(
    msg => msg.fromUserId === userId || msg.toUserId === userId
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(userMessages);
});

app.get('/api/messages/:userId/:friendId', (req, res) => {
  const { userId, friendId } = req.params;
  const conversationMessages = messages.filter(
    msg => (msg.fromUserId === userId && msg.toUserId === friendId) ||
           (msg.fromUserId === friendId && msg.toUserId === userId)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(conversationMessages);
});

app.post('/api/messages', (req, res) => {
  const { fromUserId, toUserId, content } = req.body;
  
  if (!fromUserId || !toUserId || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Check if users are friends
  const userFriends = friends[fromUserId] || [];
  if (!userFriends.includes(toUserId)) {
    return res.status(403).json({ error: 'You can only message friends' });
  }
  
  const newMessage = {
    id: uuidv4(),
    fromUserId,
    toUserId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  
  messages.push(newMessage);
  saveMessages();
  res.status(201).json(newMessage);
});

app.put('/api/messages/:messageId/read', (req, res) => {
  const { messageId } = req.params;
  const message = messages.find(msg => msg.id === messageId);
  
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  message.read = true;
  saveMessages();
  res.json(message);
});

// Friend Requests endpoints
app.get('/api/friend-requests/:userId', (req, res) => {
  const { userId } = req.params;
  const requests = friendRequests.filter(
    req => (req.toUserId === userId && req.status === 'pending') ||
           (req.fromUserId === userId && req.status === 'pending')
  );
  
  const requestsWithUsers = requests.map(req => {
    const otherUserId = req.fromUserId === userId ? req.toUserId : req.fromUserId;
    const otherUser = users.find(u => u.id === otherUserId);
    return {
      ...req,
      otherUser: otherUser ? {
        id: otherUser.id,
        username: otherUser.username,
        email: otherUser.email,
        avatar: otherUser.avatar
      } : null,
      isIncoming: req.toUserId === userId
    };
  }).filter(req => req.otherUser !== null);
  
  res.json(requestsWithUsers);
});

app.get('/api/friend-requests/incoming/:userId', (req, res) => {
  const { userId } = req.params;
  const incomingRequests = friendRequests.filter(
    req => req.toUserId === userId && req.status === 'pending'
  );
  
  const requestsWithUsers = incomingRequests.map(req => {
    const fromUser = users.find(u => u.id === req.fromUserId);
    return {
      ...req,
      fromUser: fromUser ? {
        id: fromUser.id,
        username: fromUser.username,
        email: fromUser.email,
        avatar: fromUser.avatar
      } : null
    };
  }).filter(req => req.fromUser !== null);
  
  res.json(requestsWithUsers);
});

app.post('/api/friend-requests', (req, res) => {
  const { fromUserId, toUserId } = req.body;
  
  if (!fromUserId || !toUserId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (fromUserId === toUserId) {
    return res.status(400).json({ error: 'Cannot send friend request to yourself' });
  }
  
  // Check if already friends
  const userFriends = friends[fromUserId] || [];
  if (userFriends.includes(toUserId)) {
    return res.status(400).json({ error: 'Already friends' });
  }
  
  // Check if request already exists
  const existingRequest = friendRequests.find(
    req => ((req.fromUserId === fromUserId && req.toUserId === toUserId) ||
            (req.fromUserId === toUserId && req.toUserId === fromUserId)) &&
           req.status === 'pending'
  );
  
  if (existingRequest) {
    return res.status(400).json({ error: 'Friend request already exists' });
  }
  
  const newRequest = {
    id: uuidv4(),
    fromUserId,
    toUserId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  friendRequests.push(newRequest);
  saveFriendRequests();
  res.status(201).json(newRequest);
});

app.put('/api/friend-requests/:requestId/accept', (req, res) => {
  const { requestId } = req.params;
  const request = friendRequests.find(req => req.id === requestId);
  
  if (!request) {
    return res.status(404).json({ error: 'Friend request not found' });
  }
  
  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Request already processed' });
  }
  
  request.status = 'accepted';
  
  // Add to friends list
  if (!friends[request.fromUserId]) {
    friends[request.fromUserId] = [];
  }
  if (!friends[request.toUserId]) {
    friends[request.toUserId] = [];
  }
  
  if (!friends[request.fromUserId].includes(request.toUserId)) {
    friends[request.fromUserId].push(request.toUserId);
  }
  if (!friends[request.toUserId].includes(request.fromUserId)) {
    friends[request.toUserId].push(request.fromUserId);
  }
  
  saveFriendRequests();
  saveFriends();
  res.json({ message: 'Friend request accepted', request });
});

app.put('/api/friend-requests/:requestId/reject', (req, res) => {
  const { requestId } = req.params;
  const request = friendRequests.find(req => req.id === requestId);
  
  if (!request) {
    return res.status(404).json({ error: 'Friend request not found' });
  }
  
  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Request already processed' });
  }
  
  request.status = 'rejected';
  saveFriendRequests();
  res.json({ message: 'Friend request rejected', request });
});

app.get('/api/users/search', (req, res) => {
  const { query } = req.query;
  
  if (!query || query.trim().length < 1) {
    return res.json([]);
  }
  
  const searchTerm = query.toLowerCase().trim();
  const matchingUsers = users.filter(
    user => user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
  ).map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar
  }));
  
  res.json(matchingUsers);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Қате орын алды! Сервер қатесі.' });
});

// 404 handler
app.use((req, res) => {
  // Ignore Chrome DevTools requests
  if (req.path.includes('.well-known') || req.path.includes('devtools')) {
    return res.status(404).send();
  }
  
  console.log(`❌ Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.path,
    note: 'This is the backend API server. Frontend is available at http://localhost:5174',
    availableRoutes: [
      'GET /',
      'GET /api',
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/codes',
      'GET /api/codes/:id',
      'POST /api/codes',
      'PUT /api/codes/:id',
      'DELETE /api/codes/:id',
      'GET /api/user',
      'PUT /api/user',
      'GET /api/users/:id'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

