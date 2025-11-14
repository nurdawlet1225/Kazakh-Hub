import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadModal from '../components/UploadModal';
import './Upload.css';

const Upload: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  const handleClose = () => {
    setIsModalOpen(false);
    navigate('/');
  };

  return (
    <div className="upload-page">
      <UploadModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default Upload;

