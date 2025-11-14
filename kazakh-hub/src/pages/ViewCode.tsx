import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faUpload, faHeart, faCheck, faCopy, faUser, faComment } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faRegHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { CodeFile, Comment } from '../utils/api';
import { apiService } from '../utils/api';
import CodeEditor from '../components/CodeEditor';
import FileExplorer from '../components/FileExplorer';
import UploadModal from '../components/UploadModal';
import './ViewCode.css';

interface CommentItemProps {
  comment: Comment;
  currentUser: { id: string; username: string } | null;
  editingCommentId: string | null;
  editingCommentText: string;
  setEditingCommentText: (text: string) => void;
  replyingToCommentId: string | null;
  replyText: string;
  setReplyText: (text: string) => void;
  isSubmittingReply: boolean;
  onEdit: (comment: Comment) => void;
  onSave: (commentId: string) => void;
  onCancelEdit: () => void;
  onDelete: (commentId: string) => void;
  onReply: (commentId: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (e: React.FormEvent, parentId: string) => void;
  onLike: (commentId: string) => void;
  onDislike: (commentId: string) => void;
  formatDate: (dateString: string) => string;
  allComments?: Comment[];
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  editingCommentId,
  editingCommentText,
  setEditingCommentText,
  replyingToCommentId,
  replyText,
  setReplyText,
  isSubmittingReply,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onReply,
  onCancelReply,
  onSubmitReply,
  onLike,
  onDislike,
  formatDate,
  allComments = [],
}) => {
  const { t } = useTranslation();
  const isLiked = currentUser ? comment.likes?.includes(currentUser.id) : false;
  const isDisliked = currentUser ? comment.dislikes?.includes(currentUser.id) : false;
  const likeCount = comment.likes?.length || 0;
  const dislikeCount = comment.dislikes?.length || 0;
  const isReply = comment.parentId ? true : false;
  
  // Find parent comment
  const parentComment = comment.parentId 
    ? allComments.find(c => c.id === comment.parentId)
    : null;

  return (
    <div className={`comment-item ${isReply ? 'comment-reply-item' : ''}`} data-comment-id={comment.id}>
      {isReply && parentComment && (
        <div className="reply-to-indicator">
          <span className="reply-arrow">↳</span>
          <span className="reply-to-text">
            <span className="reply-to-author">{parentComment.author}</span>
            <span className="reply-to-content">{parentComment.content.length > 50 
              ? parentComment.content.substring(0, 50) + '...' 
              : parentComment.content}</span>
          </span>
        </div>
      )}
      <div className="comment-header">
        <div className="comment-header-left">
          <span className="comment-author"><FontAwesomeIcon icon={faUser} /> {comment.author}</span>
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
        </div>
        {currentUser && currentUser.username === comment.author && (
          <div className="comment-actions">
            {editingCommentId === comment.id ? (
              <>
                <button
                  className="btn-comment-save"
                  onClick={() => onSave(comment.id)}
                >
                  ✓ {t('common.save')}
                </button>
                <button
                  className="btn-comment-cancel"
                  onClick={onCancelEdit}
                >
                  ✕ {t('common.cancel')}
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-comment-edit"
                  onClick={() => onEdit(comment)}
                >
                  <FontAwesomeIcon icon={faEdit} /> {t('common.edit')}
                </button>
                <button
                  className="btn-comment-delete"
                  onClick={() => onDelete(comment.id)}
                >
                  <FontAwesomeIcon icon={faTrash} /> {t('common.delete')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {editingCommentId === comment.id ? (
        <textarea
          className="comment-edit-input"
          value={editingCommentText}
          onChange={(e) => setEditingCommentText(e.target.value)}
          rows={3}
        />
      ) : (
        <div className="comment-content">{comment.content}</div>
      )}
      <div className="comment-reactions">
        <button
          className={`comment-reaction-btn ${isLiked ? 'liked' : ''}`}
          onClick={() => onLike(comment.id)}
          disabled={!currentUser}
          title="Лайк"
        >
          👍 {likeCount}
        </button>
        <button
          className={`comment-reaction-btn ${isDisliked ? 'disliked' : ''}`}
          onClick={() => onDislike(comment.id)}
          disabled={!currentUser}
          title="Дизлайк"
        >
          👎 {dislikeCount}
        </button>
        {currentUser && (
          <button
            className="btn-comment-reply"
            onClick={() => onReply(comment.id)}
          >
            <FontAwesomeIcon icon={faComment} /> {t('viewCode.reply')}
          </button>
        )}
      </div>
      {replyingToCommentId === comment.id && (
        <form
          className="reply-form"
          onSubmit={(e) => onSubmitReply(e, comment.id)}
        >
          <textarea
            className="reply-input"
            placeholder={t('viewCode.replyPlaceholder')}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmitReply(e, comment.id);
              }
            }}
            rows={2}
          />
          <div className="reply-actions">
            <button
              type="submit"
              className="btn-reply-submit"
              disabled={!replyText.trim() || isSubmittingReply}
            >
              {isSubmittingReply ? t('common.loading') : t('common.submit')}
            </button>
            <button
              type="button"
              className="btn-reply-cancel"
              onClick={onCancelReply}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const ViewCode: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState<CodeFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [folderFiles, setFolderFiles] = useState<CodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  useEffect(() => {
    if (id) {
      loadCode(id);
    }
  }, [id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showActionsMenu && !target.closest('.code-actions-menu')) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsMenu]);

  const loadCurrentUser = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setCurrentUser({ id: userData.id, username: userData.username });
      }
    } catch (err) {
      console.error('Failed to load current user:', err);
    }
  };

  const loadCode = async (codeId: string) => {
    try {
      setLoading(true);
      const data = await apiService.getCodeFile(codeId);
      setCode(data);
      setError(null);
      
      // Load current user if not already loaded
      if (!currentUser) {
        await loadCurrentUser();
      }
      
      // Increment view count (after code is loaded)
      try {
        // Get current user from state or localStorage
        const userId = currentUser?.id || (() => {
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              return userData.id || null;
            }
          } catch (e) {
            // Ignore
          }
          return null;
        })();
        const updatedCode = await apiService.incrementView(codeId, userId);
        if (updatedCode) {
          setCode(updatedCode);
        }
      } catch (viewError) {
        // Silently fail if view increment fails
        console.error('Failed to increment view:', viewError);
      }
      
      // Load files
      await loadFolderFiles(codeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Кодты жүктеу қатесі');
    } finally {
      setLoading(false);
    }
  };

  const loadFolderFiles = async (folderId: string) => {
    try {
      setLoadingFiles(true);
      const files = await apiService.getCodeFiles(folderId);
      setFolderFiles(files);
      if (files.length > 0) {
        setSelectedFile(files[0]);
      }
    } catch (err) {
      console.error('Failed to load folder files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleRefreshFolder = async () => {
    if (code && id) {
      await loadFolderFiles(id);
    }
  };

  const handleFileSelect = (file: CodeFile) => {
    setSelectedFile(file);
  };

  const handleUploadSuccess = async () => {
    if (code && id) {
      await loadFolderFiles(id);
      await loadCode(id);
    }
  };

  const handleDeleteCode = async () => {
    if (!code || !currentUser) return;

    // Тек автор ғана жоя алады (батырма тек авторға ғана көрсетіледі, бірақ қосымша қауіпсіздік үшін тексереміз)
    if (code.author !== currentUser.username) {
      alert('Тек қана папка/файл авторы жоя алады');
      return;
    }

    const confirmMessage = `"${code.title}" жоюға сенімдісіз бе?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiService.deleteCodeFile(code.id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete code:', err);
      alert('Кодты жою қатесі');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditCode = () => {
    if (!code) return;
    setEditTitle(code.title);
    setEditDescription(code.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!code || !editTitle.trim()) return;

    try {
      setIsSaving(true);
      const updatedCode = await apiService.updateCodeFile(code.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setCode(updatedCode);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update code:', err);
      alert('Папканы өңдеу қатесі');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditFolder = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditDescription('');
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('kk-KZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLike = async () => {
    if (!code || !currentUser) return;
    
    try {
      const isLiked = code.likes?.includes(currentUser.id);
      const updatedCode = isLiked
        ? await apiService.unlikeCode(code.id, currentUser.id)
        : await apiService.likeCode(code.id, currentUser.id);
      setCode(updatedCode);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) {
    e.preventDefault();
    }
    if (!code || !currentUser || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const updatedCode = await apiService.addComment(
        code.id,
        currentUser.username,
        commentText.trim()
      );
      setCode(updatedCode);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleSaveComment = async (commentId: string) => {
    if (!code || !editingCommentText.trim()) return;

    try {
      const updatedCode = await apiService.updateComment(
        code.id,
        commentId,
        editingCommentText.trim()
      );
      setCode(updatedCode);
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      console.error('Failed to update comment:', err);
      alert('Пікірді өңдеу қатесі');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!code) return;
    
    if (!confirm(t('viewCode.deleteConfirm'))) {
      return;
    }

    try {
      const updatedCode = await apiService.deleteComment(code.id, commentId);
      setCode(updatedCode);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Пікірді жою қатесі');
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingToCommentId(commentId);
    setReplyText('');
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setReplyText('');
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!code || !currentUser || !replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const updatedCode = await apiService.addReply(
        code.id,
        parentId,
        currentUser.username,
        replyText.trim()
      );
      setCode(updatedCode);
      setReplyText('');
      setReplyingToCommentId(null);
      
      // Жаңа жауапқа scroll жасау
      setTimeout(() => {
        const repliesContainer = document.querySelector(`[data-parent-id="${parentId}"]`);
        if (repliesContainer) {
          const replies = repliesContainer.querySelectorAll('.comment-item');
          if (replies.length > 0) {
            const lastReply = replies[replies.length - 1] as HTMLElement;
            lastReply.classList.add('new-reply');
            lastReply.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Анимациядан кейін классты алып тастау
            setTimeout(() => {
              lastReply.classList.remove('new-reply');
            }, 1000);
          }
        }
      }, 100);
    } catch (err) {
      console.error('Failed to add reply:', err);
      alert('Жауап қосу қатесі');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!code || !currentUser) return;

    try {
      const updatedCode = await apiService.likeComment(code.id, commentId, currentUser.id);
      setCode(updatedCode);
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const handleDislikeComment = async (commentId: string) => {
    if (!code || !currentUser) return;

    try {
      const updatedCode = await apiService.dislikeComment(code.id, commentId, currentUser.id);
      setCode(updatedCode);
    } catch (err) {
      console.error('Failed to dislike comment:', err);
    }
  };

  // Organize comments: top-level comments first, then all their replies below (flat structure, recursive)
  const organizeComments = (comments: Comment[]): Comment[] => {
    const topLevel: Comment[] = [];
    const repliesMap: Record<string, Comment[]> = {};

    // Separate top-level comments and replies
    comments.forEach(comment => {
      if (comment.parentId) {
        if (!repliesMap[comment.parentId]) {
          repliesMap[comment.parentId] = [];
        }
        repliesMap[comment.parentId].push(comment);
      } else {
        topLevel.push(comment);
      }
    });

    // Recursive function to add comment and all its replies (flat structure)
    const addCommentAndReplies = (comment: Comment): Comment[] => {
      const result: Comment[] = [comment];
      // Add all replies directly below the parent comment
      if (repliesMap[comment.id]) {
        repliesMap[comment.id].forEach(reply => {
          // Recursively add reply and its own replies
          result.push(...addCommentAndReplies(reply));
        });
      }
      return result;
    };

    // Create flat list: top-level comment, then all its replies (recursively), then next top-level comment, etc.
    const result: Comment[] = [];
    topLevel.forEach(comment => {
      result.push(...addCommentAndReplies(comment));
    });

    return result;
  };

  const isLiked = code && currentUser ? code.likes?.includes(currentUser.id) : false;
  const likeCount = code?.likes?.length || 0;

  if (loading) {
    return (
      <div className="view-code-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !code) {
    return (
      <div className="view-code-container">
        <div className="error-state">
          <p className="error-icon">❌</p>
          <p className="error-title">{t('viewCode.error')}</p>
          <p className="error-message">{error || t('viewCode.pageNotFound')}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            {t('home.title')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-code-container">
      <button onClick={() => navigate(-1)} className="back-button">
        ← {t('common.back')}
      </button>

      <div className="code-header">
        <div className="code-header-main">
          <div className="code-header-top">
            <div className="code-header-title-section">
          <h1 className="code-title">{code.title}</h1>
          {code.description && (
            <p className="code-description">{code.description}</p>
          )}
            </div>
            {currentUser && code.author === currentUser.username && (
              <div className="code-actions-menu">
                <button
                  className="btn-actions-menu-toggle"
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  title="Әрекеттер"
                >
                  <span className="menu-icon">
                    <span className="menu-line"></span>
                    <span className="menu-line"></span>
                    <span className="menu-line"></span>
                  </span>
                </button>
                {showActionsMenu && (
                  <div className="actions-menu-dropdown">
                    {currentUser && code.author === currentUser.username && (
                      <button
                        className="actions-menu-item"
                        onClick={() => {
                          setShowUploadModal(true);
                          setShowActionsMenu(false);
                        }}
                      >
                        <FontAwesomeIcon icon={faUpload} /> Кодты қайта жүктеу
                      </button>
                    )}
                    {currentUser && code.author === currentUser.username && (
                      <button
                        className="actions-menu-item"
                        onClick={() => {
                          handleEditCode();
                          setShowActionsMenu(false);
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} /> {t('common.edit')}
                      </button>
                    )}
                    {currentUser && code.author === currentUser.username && (
                      <button
                        className="actions-menu-item actions-menu-item-danger"
                        onClick={() => {
                          handleDeleteCode();
                          setShowActionsMenu(false);
                        }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? t('common.loading') : <><FontAwesomeIcon icon={faTrash} /> {t('common.delete')}</>}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="code-meta">
          <div className="meta-item">
            <span className="meta-label">{t('viewCode.language')}:</span>
            <span className="meta-value">{code.language}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t('viewCode.author')}:</span>
            <span className="meta-value">{code.author}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t('viewCode.created')}:</span>
            <span className="meta-value">{formatDate(code.createdAt)}</span>
          </div>
          {code.updatedAt !== code.createdAt && (
            <div className="meta-item">
              <span className="meta-label">{t('viewCode.updated')}:</span>
              <span className="meta-value">{formatDate(code.updatedAt)}</span>
            </div>
          )}
          <div className="meta-item meta-actions">
            <button
              className={`like-button-header ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={!currentUser}
              title={currentUser ? (isLiked ? 'Лайкты алып тастау' : 'Лайк қосу') : 'Лайк қосу үшін кіру керек'}
            >
              <FontAwesomeIcon icon={isLiked ? faHeart : faRegHeartRegular} /> {likeCount}
            </button>
          </div>
        </div>


        {code.tags && code.tags.length > 0 && (
          <div className="code-tags">
            {code.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="folder-view-wrapper">
        <div className="folder-view">
          <div className="folder-explorer">
              <div className="folder-explorer-header">
                <h3 className="folder-explorer-title">Файлдар ({folderFiles.length})</h3>
                <button
                  className="btn-refresh-folder"
                  onClick={handleRefreshFolder}
                  disabled={loadingFiles}
                  title="Жаңарту"
                >
                  {loadingFiles ? '⏳' : '🔄'}
                </button>
              </div>
            <FileExplorer
              files={folderFiles}
              onFileSelect={handleFileSelect}
              selectedFileId={selectedFile?.id}
              showFolderStructure={true}
            />
          </div>
          <div className="folder-content">
            {loadingFiles ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                  <p>{t('viewCode.loadingFiles')}</p>
              </div>
            ) : selectedFile ? (
              <>
                <div className="file-code-container">
                <div className="file-header">
                  <div className="file-header-left">
                    <h3 className="file-title">{selectedFile.title}</h3>
                    <span className="file-path">{selectedFile.folderPath}</span>
                  </div>
                </div>
                  <div className="code-wrapper">
                <CodeEditor
                  code={selectedFile.content}
                  language={selectedFile.language}
                  readOnly={true}
                  lineNumbers={true}
                />
                  <button
                      className="btn-copy-code-sticky"
                    onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(selectedFile.content);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 5000);
                      } catch (err) {
                          console.error('Failed to copy:', err);
                      }
                    }}
                  >
                      {isCopied ? <><FontAwesomeIcon icon={faCheck} /> Код көшірілді</> : <><FontAwesomeIcon icon={faCopy} /> {t('viewCode.copyCode')}</>}
                  </button>
                  </div>
                </div>
              </>
              ) : (
                <div className="no-file-selected">
                  <p>{t('viewCode.noFileSelected')}</p>
                </div>
              )}
          </div>
                </div>

          {/* Папка үшін ортақ пікірлер контейнері */}
          <div className="folder-comments-container">
                <div className="comments-section-separate">
                  <div className="comments-section-header">
                <h2 className="comments-title"><FontAwesomeIcon icon={faComment} /> {t('viewCode.comments')} ({code.comments?.length || 0})</h2>
                    <div className="comments-divider"></div>
                  </div>
                  
                  {currentUser ? (
                <form onSubmit={handleAddComment} className="comment-form">
                      <textarea
                        className="comment-input"
                    placeholder={t('viewCode.commentPlaceholder')}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                        rows={3}
                      />
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={!commentText.trim() || isSubmittingComment}
                      >
                    {isSubmittingComment ? t('common.loading') : t('viewCode.addComment')}
                      </button>
                    </form>
                  ) : (
                    <p className="comment-login-prompt">
                  {t('viewCode.loginToComment')} <button onClick={() => navigate('/login')} className="link-button">{t('common.login')}</button>
                    </p>
                  )}

                  <div className="comments-list">
                {code.comments && code.comments.length > 0 ? (
                  organizeComments(code.comments).map((comment: Comment) => (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          currentUser={currentUser}
                          editingCommentId={editingCommentId}
                          editingCommentText={editingCommentText}
                          setEditingCommentText={setEditingCommentText}
                          replyingToCommentId={replyingToCommentId}
                          replyText={replyText}
                          setReplyText={setReplyText}
                          isSubmittingReply={isSubmittingReply}
                          onEdit={handleEditComment}
                      onSave={handleSaveComment}
                          onCancelEdit={handleCancelEdit}
                      onDelete={handleDeleteComment}
                          onReply={handleReply}
                          onCancelReply={handleCancelReply}
                      onSubmitReply={handleSubmitReply}
                      onLike={handleLikeComment}
                      onDislike={handleDislikeComment}
                          formatDate={formatDate}
                      allComments={code.comments || []}
                        />
                      ))
                    ) : (
                  <p className="no-comments">{t('viewCode.noComments')}</p>
                    )}
                  </div>
                </div>
          </div>
        </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={handleCancelEditFolder}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Папканы өңдеу</h3>
              <button className="modal-close" onClick={handleCancelEditFolder}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-title">Атауы:</label>
                <input
                  id="edit-title"
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Папка атауы"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-description">Сипаттама:</label>
                <textarea
                  id="edit-description"
                  className="form-textarea"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Папка сипаттамасы"
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={handleCancelEditFolder}
                disabled={isSaving}
              >
                {t('common.cancel')}
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveEdit}
                disabled={isSaving || !editTitle.trim()}
              >
                {isSaving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default ViewCode;

