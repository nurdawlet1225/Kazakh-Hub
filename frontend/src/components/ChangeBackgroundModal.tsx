import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { User } from '../utils/api';
import './ChangeBackgroundModal.css';

interface ChangeBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: () => void;
}

const ChangeBackgroundModal: React.FC<ChangeBackgroundModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate,
}) => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Load background image from localStorage
      const savedBg = localStorage.getItem(`profile-bg-${user.id}`);
      setBackgroundImage(savedBg || null);
      setBackgroundPreview(savedBg || null);
      setError(null);
    }
  }, [isOpen, user.id]);

  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<string> => {
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

  const handleBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Тек сурет файлдарын таңдаңыз (JPG, PNG, GIF)');
      if (backgroundInputRef.current) {
        backgroundInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError('Сурет өлшемі 10MB-тан аспауы керек');
      if (backgroundInputRef.current) {
        backgroundInputRef.current.value = '';
      }
      return;
    }

    try {
      // Compress and convert to base64 (larger size for background)
      const compressedBase64 = await compressImage(file, 1920, 0.85);
      
      // Check compressed size (max 3MB base64 for background)
      if (compressedBase64.length > 3 * 1024 * 1024) {
        // Try with lower quality
        const moreCompressed = await compressImage(file, 1600, 0.75);
        setBackgroundImage(moreCompressed);
        setBackgroundPreview(moreCompressed);
        console.log('Background image compressed to:', (moreCompressed.length / 1024).toFixed(2), 'KB');
      } else {
        setBackgroundImage(compressedBase64);
        setBackgroundPreview(compressedBase64);
        console.log('Background image compressed to:', (compressedBase64.length / 1024).toFixed(2), 'KB');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error processing background image:', err);
      setError(err instanceof Error ? err.message : 'Суретті өңдеу қатесі');
      if (backgroundInputRef.current) {
        backgroundInputRef.current.value = '';
      }
    }
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(null);
    setBackgroundPreview(null);
    if (backgroundInputRef.current) {
      backgroundInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    setLoading(true);
    try {
      // Save background image to localStorage
      if (backgroundImage) {
        localStorage.setItem(`profile-bg-${user.id}`, backgroundImage);
      } else {
        localStorage.removeItem(`profile-bg-${user.id}`);
      }

      // Dispatch custom event to notify Profile component
      window.dispatchEvent(new CustomEvent('profileBackgroundUpdated'));

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error saving background:', err);
      setError('Фонды сақтау қатесі');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content change-background-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Фон өзгерту</h2>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="change-background-form">
          <div className="form-group background-group">
            <label>Профиль фон суреті</label>
            <div className="background-upload-container">
              <div 
                className="background-preview"
                onClick={() => backgroundInputRef.current?.click()}
                title="Фон суретін таңдау үшін басыңыз"
                style={backgroundPreview ? { backgroundImage: `url(${backgroundPreview})` } : {}}
              >
                {!backgroundPreview && (
                  <div className="background-placeholder">
                    <span>+</span>
                    <span>Фон суретін қосу</span>
                  </div>
                )}
                <input
                  ref={backgroundInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundChange}
                  style={{ display: 'none' }}
                  id="background-upload"
                />
              </div>
              <div className="background-actions">
                {backgroundPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveBackground}
                    className="btn-remove-background"
                  >
                    <FontAwesomeIcon icon={faTrash} /> Фонды жою
                  </button>
                )}
              </div>
            </div>
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
            <button type="button" onClick={handleSave} className="btn-primary" disabled={loading}>
              {loading ? 'Сақталуда...' : 'Сақтау'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeBackgroundModal;

