import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineCloudUpload, HiOutlinePhotograph, HiOutlinePlay } from 'react-icons/hi';
import './Upload.css';

export default function Upload() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', tags: '', category: 'other' });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) setVideoFile(file);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file, signatureData, onProgress) => {
    const fData = new FormData();
    fData.append("file", file);
    fData.append("api_key", signatureData.apiKey);
    fData.append("timestamp", signatureData.timestamp);
    fData.append("signature", signatureData.signature);

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`,
      fData,
      { onUploadProgress: onProgress }
    );
    return res.data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile || !thumbnail) return toast.error('Video and thumbnail are required');
    if (!formData.title.trim() || !formData.description.trim()) return toast.error('Title and description required');

    setUploading(true);
    setProgress(0);

    try {
      // 1. Get secure signature from our backend
      const sigRes = await API.get('/video/sign-upload');
      const signatureData = sigRes.data.data;

      // 2. Upload Thumbnail first (lightweight)
      const thumbData = await uploadToCloudinary(thumbnail, signatureData, () => {});

      // 3. Upload Video (heavyweight)
      const vidData = await uploadToCloudinary(videoFile, signatureData, (e) => {
        setProgress(Math.round((e.loaded * 100) / e.total));
      });

      // 4. Save to Database using lightweight backend request
      await API.post('/video', {
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        category: formData.category,
        videoUrl: vidData.secure_url,
        videoPublicId: vidData.public_id,
        thumbnailUrl: thumbData.secure_url,
        thumbnailPublicId: thumbData.public_id,
        duration: vidData.duration || 0
      });

      toast.success('Video published successfully! 🎉');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="page-container">
      <motion.div
        className="upload-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="upload-title">
          <HiOutlineCloudUpload /> Upload <span className="text-gradient">Video</span>
        </h1>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="upload-grid">
            <div className="upload-dropzone">
              <label htmlFor="video-file" className={`dropzone-label ${videoFile ? 'has-file' : ''}`}>
                {videoFile ? (
                  <div className="file-preview">
                    <HiOutlinePlay className="file-icon" />
                    <p className="file-name">{videoFile.name}</p>
                    <p className="file-size">{(videoFile.size / (1024*1024)).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <HiOutlineCloudUpload className="dropzone-icon" />
                    <p>Click to select a video file</p>
                    <span>MP4, WebM, MOV up to 500MB</span>
                  </div>
                )}
              </label>
              <input type="file" id="video-file" accept="video/*" onChange={handleVideoChange} hidden />
            </div>

            <div className="upload-thumb-zone">
              <label htmlFor="thumb-file" className="thumb-label">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail" className="thumb-preview" />
                ) : (
                  <div className="dropzone-content">
                    <HiOutlinePhotograph className="dropzone-icon" />
                    <p>Thumbnail</p>
                    <span>16:9 recommended</span>
                  </div>
                )}
              </label>
              <input type="file" id="thumb-file" accept="image/*" onChange={handleThumbnailChange} hidden />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="video-title">Title</label>
            <input id="video-title" type="text" className="input-field" placeholder="Enter video title"
              value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
          </div>

          <div className="input-group">
            <label htmlFor="video-desc">Description</label>
            <textarea id="video-desc" className="input-field" placeholder="Tell viewers about your video"
              rows={4} value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})} required />
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
          )}

          <motion.button type="submit" className="btn btn-primary upload-submit"
            disabled={uploading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {uploading ? <><span className="spinner" /> Uploading...</> : <><HiOutlineCloudUpload /> Publish Video</>}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
