import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEye, faEyeSlash, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { User } from '../utils/api';
import { apiService } from '../utils/api';
import './EditProfileModal.css';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: User) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    avatar: user.avatar || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordSectionVisible, setIsPasswordSectionVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Scroll to top when modal opens
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setFormData({
        username: user.username,
        email: user.email,
        avatar: user.avatar || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setAvatarPreview(user.avatar || null);
      setError(null);
      setPasswordError(null);
      setIsPasswordSectionVisible(false);
    }
  }, [isOpen]); // Only depend on isOpen to prevent resetting avatar when user updates

  // Update username and email when user changes, but preserve avatarPreview state
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        username: user.username,
        email: user.email,
      }));
    }
  }, [isOpen, user.username, user.email]);

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          try {
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
          } catch (err) {
            reject(new Error('Image compression failed'));
          }
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Тек сурет файлдарын таңдаңыз (JPG, PNG, GIF)');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError('Сурет өлшемі 10MB-тан аспауы керек');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      // Compress and convert to base64
      const compressedBase64 = await compressImage(file);
      
      // Check compressed size (max 2MB base64)
      if (compressedBase64.length > 2 * 1024 * 1024) {
        // Try with lower quality
        const moreCompressed = await compressImage(file, 600, 0.6);
        setFormData((prev) => ({ ...prev, avatar: moreCompressed }));
        setAvatarPreview(moreCompressed);
        console.log('Image compressed to:', (moreCompressed.length / 1024).toFixed(2), 'KB');
      } else {
        setFormData((prev) => ({ ...prev, avatar: compressedBase64 }));
        setAvatarPreview(compressedBase64);
        console.log('Image compressed to:', (compressedBase64.length / 1024).toFixed(2), 'KB');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : 'Суретті өңдеу қатесі');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    // Only update local state, don't save until user clicks "Save"
    setFormData((prev) => ({ ...prev, avatar: '' }));
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordError(null);
    setLoading(true);

    try {
      // Check if password change is requested
      const isPasswordChange = formData.newPassword.trim() !== '' || formData.confirmPassword.trim() !== '';
      
      if (isPasswordChange) {
        // Validate password fields
        if (!formData.newPassword) {
          setPasswordError('Жаңа құпия сөз енгізіңіз');
          setLoading(false);
          return;
        }

        if (formData.newPassword.length < 6) {
          setPasswordError('Жаңа құпия сөз кемінде 6 таңбадан тұруы керек');
          setLoading(false);
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          setPasswordError('Құпия сөздер сәйкес келмейді');
          setLoading(false);
          return;
        }

        // Change password
        try {
          await apiService.changePassword(
            user.id,
            formData.currentPassword || null,
            formData.newPassword
          );
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Құпия сөзді өзгерту қатесі';
          setPasswordError(errorMessage);
          setLoading(false);
          return;
        }
      }

      // Update profile
      const updateData: Partial<User> & { userId?: string; currentEmail?: string } = {
        username: formData.username,
        email: formData.email,
        userId: user.id, // Send user ID to help backend find the user
        currentEmail: user.email, // Send current email as backup
      };

      // Always include avatar - send null if empty (to remove avatar), or the base64 string
      if (formData.avatar && formData.avatar.trim() !== '') {
        updateData.avatar = formData.avatar;
      } else {
        updateData.avatar = null; // Explicitly set to null to remove avatar
      }

      console.log('Updating profile with:', { 
        ...updateData, 
        avatar: updateData.avatar ? 'base64 image (length: ' + updateData.avatar.length + ')' : 'null' 
      });

      const updatedUser = await apiService.updateUserProfile(updateData);
      
      console.log('Profile updated successfully:', { 
        id: updatedUser.id, 
        username: updatedUser.username, 
        email: updatedUser.email,
        hasAvatar: !!updatedUser.avatar 
      });

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Dispatch custom event to notify Header component
      window.dispatchEvent(new CustomEvent('userProfileUpdated'));

      onUpdate(updatedUser);
      onClose();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      
      // If user not found, clear localStorage and redirect to login
      if (err?.message?.includes('User not found') || err?.message?.includes('Пайдаланушы табылмады')) {
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('userProfileUpdated'));
        alert('Пайдаланушы табылмады. Жүйені қайта жүктеңіз немесе қайта кіріңіз.');
        window.location.reload();
        return;
      }
      let errorMessage = err instanceof Error ? err.message : 'Профильді жаңарту қатесі';
      
      // Remove password-related error message for profile updates (not password changes)
      if (errorMessage.includes('Пайдаланушы табылмады немесе құпия сөз дұрыс емес')) {
        errorMessage = 'Пайдаланушы табылмады. Жүйені қайта жүктеңіз.';
      }
      
      // Show more specific error messages
      if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('табылмады')) {
        setError('Пайдаланушы табылмады. Жүйені қайта жүктеңіз.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Серверге қосылу мүмкін емес. Backend-тің жұмыс істеп тұрғанын тексеріңіз.');
      } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        setError('Деректер дұрыс емес. Барлық өрістерді тексеріңіз.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Профильді өзгерту</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="form-group avatar-group">
            <label>Профиль фотосы</label>
            <div className="avatar-upload-container">
              <div 
                className="avatar-preview"
                onClick={() => fileInputRef.current?.click()}
                title="Фото таңдау үшін басыңыз"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" />
                ) : (
                  <div className="avatar-placeholder">
                    {formData.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                />
              </div>
              <div className="avatar-actions">
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="btn-remove-avatar"
                  >
                    <FontAwesomeIcon icon={faTrash} /> Жою
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Пайдаланушы аты</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Пайдаланушы аты"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Электрондық пошта</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required
            />
          </div>

          <div className="form-group password-change-section">
            <div className="password-section-header">
              <button
                type="button"
                className="btn-toggle-password-section"
                onClick={() => setIsPasswordSectionVisible(!isPasswordSectionVisible)}
                title={isPasswordSectionVisible ? 'Жасыру' : 'Көрсету'}
              >
                <span>Құпия сөзді өзгерту</span>
                <span>{isPasswordSectionVisible ? 'Жасыру' : 'Көрсету'}</span>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className={`chevron-icon ${isPasswordSectionVisible ? 'rotated' : ''}`}
                />
              </button>
            </div>
            {isPasswordSectionVisible && (
              <div className="password-section-content">
            <div className="form-group">
              <label htmlFor="currentPassword">Ағымдағы құпия сөз (міндетті емес)</label>
              <input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="Ағымдағы құпия сөз"
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">Жаңа құпия сөз</label>
              <input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Жаңа құпия сөз (кемінде 6 таңба)"
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Жаңа құпия сөзді растау</label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Құпия сөзді қайталаңыз"
                minLength={6}
              />
            </div>
            {passwordError && (
              <div className="form-error">
                {passwordError}
              </div>
            )}
              </div>
            )}
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Болдырмау
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Сақталуда...' : 'Сақтау'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;

