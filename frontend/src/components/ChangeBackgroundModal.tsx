import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faTimes, faArrowsAlt, faUpload, faSearchPlus, faSearchMinus } from '@fortawesome/free-solid-svg-icons';
import { User } from '../utils/api';
import { imageStorage } from '../utils/imageStorage';
import Button from './Button';
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
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 50, y: 50 });
  const [backgroundZoom, setBackgroundZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 50, y: 50 });
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      // Load background image and position from storage
      const loadBackground = async () => {
        try {
          const savedBg = await imageStorage.getImage(`profile-bg-${user.id}`);
          setBackgroundImage(savedBg || null);
          setBackgroundPreview(savedBg || null);
          
          // Load saved position
          const savedPosition = localStorage.getItem(`profile-bg-position-${user.id}`);
          if (savedPosition) {
            try {
              const position = JSON.parse(savedPosition);
              setBackgroundPosition(position);
            } catch (e) {
              setBackgroundPosition({ x: 50, y: 50 });
            }
          } else {
            setBackgroundPosition({ x: 50, y: 50 });
          }
          
          // Load saved zoom
          const savedZoom = localStorage.getItem(`profile-bg-zoom-${user.id}`);
          if (savedZoom) {
            try {
              const zoom = parseFloat(savedZoom);
              setBackgroundZoom(Math.max(50, Math.min(200, zoom)));
            } catch (e) {
              setBackgroundZoom(100);
            }
          } else {
            setBackgroundZoom(100);
          }
          
          setError(null);
        } catch (err) {
          console.error('Failed to load background image:', err);
          setBackgroundImage(null);
          setBackgroundPreview(null);
          setBackgroundPosition({ x: 50, y: 50 });
          setBackgroundZoom(100);
          setError(null);
        }
      };
      loadBackground();
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

          // Improve image quality with better rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
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
      // Compress and convert to base64
      // Start with moderate compression
      let compressedBase64 = await compressImage(file, 1920, 0.8);
      
      // Check compressed size and reduce if needed
      // Base64 is ~33% larger than binary, so we target ~1.5MB base64 (~1.1MB binary)
      const maxBase64Size = 1.5 * 1024 * 1024; // 1.5MB base64
      let finalImage = compressedBase64;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (finalImage.length > maxBase64Size && attempts < maxAttempts) {
        attempts++;
        const width = 1920 - (attempts * 200); // Reduce width progressively
        const quality = 0.8 - (attempts * 0.1); // Reduce quality progressively
        
        if (width < 800) break; // Don't go below 800px
        if (quality < 0.5) break; // Don't go below 0.5 quality
        
        finalImage = await compressImage(file, width, quality);
        console.log(`Background image compressed (attempt ${attempts}):`, (finalImage.length / 1024).toFixed(2), 'KB');
      }
      
      console.log('Final background image size:', (finalImage.length / 1024).toFixed(2), 'KB');
      
      setBackgroundImage(finalImage);
      setBackgroundPreview(finalImage);
      setBackgroundPosition({ x: 50, y: 50 }); // Reset position for new image
      setBackgroundZoom(100); // Reset zoom for new image
      setError(null);
    } catch (err: any) {
      console.error('Error processing background image:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Суретті өңдеу қатесі';
      if (err.name === 'QuotaExceededError' || err.message?.includes('quota')) {
        errorMessage = 'Жад жеткіліксіз. Кішірек сурет таңдаңыз немесе басқа суреттерді жойыңыз.';
      } else if (err.message?.includes('compression')) {
        errorMessage = 'Суретті сығу қатесі. Басқа сурет файлын таңдаңыз.';
      }
      
      setError(errorMessage);
      if (backgroundInputRef.current) {
        backgroundInputRef.current.value = '';
      }
    }
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(null);
    setBackgroundPreview(null);
    setBackgroundPosition({ x: 50, y: 50 });
    setBackgroundZoom(100);
    if (backgroundInputRef.current) {
      backgroundInputRef.current.value = '';
    }
  };

  const handleZoomIn = () => {
    setBackgroundZoom(prev => {
      const newZoom = Math.min(200, prev + 10);
      console.log('Zoom In:', prev, '->', newZoom);
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    setBackgroundZoom(prev => {
      const newZoom = Math.max(50, prev - 10);
      console.log('Zoom Out:', prev, '->', newZoom);
      return newZoom;
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!backgroundPreview) return;
    e.preventDefault();
    // deltaY > 0 means scrolling down (zoom out), deltaY < 0 means scrolling up (zoom in)
    const delta = e.deltaY > 0 ? -5 : 5;
    setBackgroundZoom(prev => {
      const newZoom = prev + delta;
      return Math.max(50, Math.min(200, newZoom));
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!backgroundPreview) return;
    e.preventDefault();
    e.stopPropagation();
    hasDraggedRef.current = false;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { ...backgroundPosition };
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
        
        // Mark that dragging has occurred
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          hasDraggedRef.current = true;
        }
        
        setBackgroundPosition({
          x: Math.max(0, Math.min(100, positionStartRef.current.x + deltaX)),
          y: Math.max(0, Math.min(100, positionStartRef.current.y + deltaY))
        });
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        // Reset after a short delay to allow onClick check
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 100);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // Save background image using imageStorage (handles localStorage/IndexedDB automatically)
      if (backgroundImage) {
        await imageStorage.saveImage(`profile-bg-${user.id}`, backgroundImage);
        // Save position
        localStorage.setItem(`profile-bg-position-${user.id}`, JSON.stringify(backgroundPosition));
        // Save zoom
        localStorage.setItem(`profile-bg-zoom-${user.id}`, backgroundZoom.toString());
      } else {
        await imageStorage.removeImage(`profile-bg-${user.id}`);
        localStorage.removeItem(`profile-bg-position-${user.id}`);
        localStorage.removeItem(`profile-bg-zoom-${user.id}`);
      }

      // Dispatch custom event to notify Profile component
      window.dispatchEvent(new CustomEvent('profileBackgroundUpdated'));

      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error saving background:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Фонды сақтау қатесі';
      if (err.name === 'QuotaExceededError' || err.message?.includes('quota')) {
        errorMessage = 'Жад жеткіліксіз. Кішірек сурет таңдаңыз немесе басқа суреттерді жойыңыз.';
      }
      
      setError(errorMessage);
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
            <div className="background-upload-container">
              <div 
                ref={previewRef}
                className={`background-preview ${isDragging ? 'dragging' : ''}`}
                onClick={(e) => {
                  // Don't handle click if clicking on zoom controls
                  if ((e.target as HTMLElement).closest('.background-zoom-controls')) {
                    return;
                  }
                  // Prevent click if dragging occurred
                  if (hasDraggedRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  if (!backgroundPreview) {
                    backgroundInputRef.current?.click();
                  }
                }}
                onMouseDown={backgroundPreview ? handleMouseDown : undefined}
                onWheel={backgroundPreview ? handleWheel : undefined}
                title={backgroundPreview ? "Суретті жылжыту үшін тартыңыз, масштабтау үшін дөңгелекті пайдаланыңыз" : "Фон суретін таңдау үшін басыңыз"}
                style={backgroundPreview ? { 
                  backgroundImage: `url(${backgroundPreview})`,
                  backgroundPosition: `${backgroundPosition.x}% ${backgroundPosition.y}%`,
                  backgroundSize: `${backgroundZoom}% auto`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                } : {}}
              >
                {!backgroundPreview && (
                  <div className="background-placeholder">
                    <span>+</span>
                    <span>Фон суретін қосу</span>
                  </div>
                )}
                {backgroundPreview && (
                  <>
                    <div className="profile-crop-frame">
                      <div className="crop-corner crop-corner-top-left"></div>
                      <div className="crop-corner crop-corner-top-right"></div>
                      <div className="crop-corner crop-corner-bottom-left"></div>
                      <div className="crop-corner crop-corner-bottom-right"></div>
                    </div>
                    <div className="background-drag-indicator">
                      <FontAwesomeIcon icon={faArrowsAlt} />
                      <span>Суретті жылжыту</span>
                    </div>
                    <div 
                      className="background-zoom-controls"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleZoomIn();
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="btn-zoom btn-zoom-in"
                        title="Жақындату"
                      >
                        <FontAwesomeIcon icon={faSearchPlus} />
                      </button>
                      <span className="zoom-value">{backgroundZoom}%</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleZoomOut();
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="btn-zoom btn-zoom-out"
                        title="Алыстату"
                      >
                        <FontAwesomeIcon icon={faSearchMinus} />
                      </button>
                    </div>
                  </>
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
                <button
                  type="button"
                  onClick={() => backgroundInputRef.current?.click()}
                  className="btn-upload-background"
                >
                  <FontAwesomeIcon icon={faUpload} /> Сурет жүктеу
                </button>
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
            <Button type="button" onClick={onClose} variant="secondary">
              Болдырмау
            </Button>
            <Button type="button" onClick={handleSave} variant="primary" disabled={loading}>
              {loading ? 'Сақталуда...' : 'Сақтау'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeBackgroundModal;

