import React, { useState, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faImage,
  faVideo,
  faFile,
  faMicrophone,
  faMapMarkerAlt,
  faSmile,
  faPaperclip,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import './MessageInput.css';

interface MessageInputProps {
  onSendMessage: (content: string, type?: string, attachments?: any[], metadata?: any) => void;
  onUploadFile: (file: File, type: string, content?: string, metadata?: any) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onUploadFile,
  disabled = false,
  placeholder = "Хабарлама жазыңыз..."
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewFiles, setPreviewFiles] = useState<Array<{ file: File; type: string; preview?: string }>>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Common emojis
  const commonEmojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || (!message.trim() && previewFiles.length === 0 && !location)) return;

    // Send files first if any
    if (previewFiles.length > 0) {
      previewFiles.forEach(async (preview) => {
        await onUploadFile(preview.file, preview.type, message || undefined);
      });
      setPreviewFiles([]);
    }

    // Send location if any
    if (location) {
      onSendMessage(
        message || '📍 Менің орналасқан жерім',
        'location',
        undefined,
        { latitude: location.lat, longitude: location.lng, address: location.address }
      );
      setLocation(null);
    }

    // Send text message if any
    if (message.trim()) {
      onSendMessage(message.trim());
    }

    setMessage('');
    adjustTextareaHeight();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewFiles(prev => [...prev, {
          file,
          type,
          preview: type === 'image' ? reader.result as string : undefined
        }]);
      };
      if (type === 'image') {
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removePreview = (index: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    adjustTextareaHeight();
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('Геолокация қолдауы жоқ');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get address from reverse geocoding
        let address: string | undefined;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          address = data.display_name;
        } catch (e) {
          // Ignore geocoding errors
        }

        setLocation({ lat: latitude, lng: longitude, address });
      },
      (error) => {
        alert('Орналасқан жерді алу қатесі: ' + error.message);
      }
    );
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });
        
        await onUploadFile(audioFile, 'audio');
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Микрофонға қол жеткізу рұқсаты қажет');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      setRecordingTime(0);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="message-input-container">
      {/* Preview files */}
      {previewFiles.length > 0 && (
        <div className="message-preview-files">
          {previewFiles.map((preview, index) => (
            <div key={index} className="message-preview-item">
              {preview.type === 'image' && preview.preview && (
                <img src={preview.preview} alt="Preview" />
              )}
              {preview.type !== 'image' && (
                <div className="message-preview-file">
                  <FontAwesomeIcon icon={preview.type === 'video' ? faVideo : faFile} />
                  <span>{preview.file.name}</span>
                </div>
              )}
              <button
                className="message-preview-remove"
                onClick={() => removePreview(index)}
                type="button"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Location preview */}
      {location && (
        <div className="message-location-preview">
          <FontAwesomeIcon icon={faMapMarkerAlt} />
          <span>{location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</span>
          <button
            className="message-preview-remove"
            onClick={() => setLocation(null)}
            type="button"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="emoji-picker">
          <div className="emoji-picker-grid">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                className="emoji-item"
                onClick={() => handleEmojiClick(emoji)}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-dot"></div>
          <span>{formatRecordingTime(recordingTime)}</span>
          <button
            className="recording-stop-btn"
            onClick={stopRecording}
            type="button"
          >
            Тоқтату
          </button>
        </div>
      )}

      <form className="message-input-form" onSubmit={handleSend}>
        <div className="message-input-toolbar">
          <button
            type="button"
            className="message-toolbar-btn"
            onClick={() => imageInputRef.current?.click()}
            title="Сурет"
          >
            <FontAwesomeIcon icon={faImage} />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e, 'image')}
          />

          <button
            type="button"
            className="message-toolbar-btn"
            onClick={() => videoInputRef.current?.click()}
            title="Видео"
          >
            <FontAwesomeIcon icon={faVideo} />
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e, 'video')}
          />

          <button
            type="button"
            className="message-toolbar-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Файл"
          >
            <FontAwesomeIcon icon={faPaperclip} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e, 'file')}
          />

          <button
            type="button"
            className={`message-toolbar-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            title="Аудио"
            onMouseDown={(e) => {
              if (!isRecording) {
                e.preventDefault();
                startRecording();
              }
            }}
          >
            <FontAwesomeIcon icon={faMicrophone} />
          </button>

          <button
            type="button"
            className="message-toolbar-btn"
            onClick={getLocation}
            title="Орналасқан жер"
          >
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </button>

          <button
            type="button"
            className={`message-toolbar-btn ${showEmojiPicker ? 'active' : ''}`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Эмодзи"
          >
            <FontAwesomeIcon icon={faSmile} />
          </button>
        </div>

        <div className="message-input-wrapper">
          <textarea
            ref={textareaRef}
            className="message-textarea"
            value={message}
            onChange={handleInputChange}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button
            type="submit"
            className="message-send-btn"
            disabled={disabled || (!message.trim() && previewFiles.length === 0 && !location)}
            title="Жіберу"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;

