import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { apiService } from '../utils/api';
import './ImageUploadItem.css';

interface ImageUploadItemProps {
  onSuccess?: () => void;
}

const ImageUploadItem: React.FC<ImageUploadItemProps> = ({ onSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.85): Promise<string> => {
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Тек сурет файлдарын таңдаңыз (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError('Сурет өлшемі 10MB-тан аспауы керек');
      return;
    }

    try {
      setSelectedFile(file);
      const compressedBase64 = await compressImage(file);
      setImagePreview(compressedBase64);
      
      if (!title) {
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        setTitle(fileName);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : 'Суретті өңдеу қатесі');
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !imagePreview) return;

    try {
      setUploading(true);
      setError(null);

      // Get current user
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : { username: 'guest' };

      // Save image as code file with base64 content
      await apiService.createCodeFile({
        title: title || selectedFile.name,
        content: imagePreview, // Base64 image data
        language: 'image',
        author: currentUser.username || 'guest',
        description: description || `Сурет файлы: ${selectedFile.name}`,
        tags: tags ? tags.split(',').map(t => t.trim()) : ['image', 'picture'],
      });

      handleReset();
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Суретті жүктеу қатесі';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setTitle('');
    setDescription('');
    setTags('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-item">
      <div className="image-upload-header">
        <h3><FontAwesomeIcon icon={faImage} /> Сурет жүктеу</h3>
      </div>

      <form onSubmit={handleSubmit} className="image-upload-form">
        <div
          className={`image-upload-dropzone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-image' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          {imagePreview ? (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <div className="image-info">
                <span className="image-name">{selectedFile?.name}</span>
                <span className="image-size">
                  {selectedFile ? (selectedFile.size / 1024).toFixed(2) + ' KB' : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="dropzone-content">
              <span className="dropzone-icon"><FontAwesomeIcon icon={faImage} /></span>
              <p>Суретті осы жерге тартып тастаңыз немесе таңдау үшін басыңыз</p>
              <p className="dropzone-hint">JPG, PNG, GIF, WEBP форматындағы суреттер</p>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="image-title">Атауы</label>
          <input
            id="image-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Суреттің атауын енгізіңіз"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="image-description">Сипаттама (міндетті емес)</label>
          <textarea
            id="image-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Суреттің сипаттамасын енгізіңіз..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="image-tags">Тегтер (міндетті емес)</label>
          <input
            id="image-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="image, photo, picture (үтірмен бөлінген)"
          />
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={handleReset} className="btn-secondary">
            Тазалау
          </button>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={!selectedFile || !imagePreview || uploading}
          >
            {uploading ? 'Жүктелуде...' : 'Жүктеу'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImageUploadItem;

