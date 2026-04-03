import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineCloudUpload, HiOutlinePhotograph, HiOutlinePlay } from 'react-icons/hi';


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

  const uploadToCloudinary = async (file, signatureData, resourceType, onProgress) => {
    const fData = new FormData();
    fData.append("file", file);
    fData.append("api_key", signatureData.apiKey);
    fData.append("timestamp", signatureData.timestamp);
    fData.append("signature", signatureData.signature);

    // Use explicit resource type endpoint: /video/upload or /image/upload
    const uploadType = resourceType || 'auto';
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/${uploadType}/upload`,
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

      // 2. Upload Thumbnail as IMAGE (lightweight)
      const thumbData = await uploadToCloudinary(thumbnail, signatureData, 'image', () => {});

      // 3. Upload Video as VIDEO (heavyweight) — must use 'video' resource type
      const vidData = await uploadToCloudinary(videoFile, signatureData, 'video', (e) => {
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
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 lg:px-8">
      <motion.div
        className="w-full max-w-[800px] mx-auto bg-bg-surface border border-white/10 rounded-2xl p-6 md:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="flex items-center gap-3 text-2xl md:text-[28px] font-light text-[var(--text-primary)] mb-8 pb-4 border-b border-white/10">
          <HiOutlineCloudUpload className="text-[var(--primary)]" /> Upload <span className="bg-[var(--accent-gradient)] text-transparent bg-clip-text font-medium">Video</span>
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col w-full h-[200px]">
              <label htmlFor="video-file" className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-xl cursor-pointer transition-all p-5 text-center ${videoFile ? 'border-teal-primary/50 bg-teal-primary/5' : 'border-white/20 bg-white/[0.02] hover:bg-white/[0.04] hover:border-teal-soft'}`}>
                {videoFile ? (
                  <div className="flex flex-col items-center text-center gap-2 w-full truncate">
                    <HiOutlinePlay className="text-[40px] text-[var(--primary)]" />
                    <p className="text-sm font-semibold text-[var(--text-primary)] m-0 truncate w-full">{videoFile.name}</p>
                    <p className="text-xs text-[var(--text-muted)] m-0">{(videoFile.size / (1024*1024)).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <HiOutlineCloudUpload className="text-[40px] text-[var(--primary)]" />
                    <p className="text-sm font-semibold text-[var(--text-primary)] m-0">Click to select a video file</p>
                    <span className="text-xs text-[var(--text-muted)]">MP4, WebM, MOV up to 500MB</span>
                  </div>
                )}
              </label>
              <input type="file" id="video-file" accept="video/*" onChange={handleVideoChange} hidden />
            </div>

            <div className="flex flex-col w-full h-[200px]">
              <label htmlFor="thumb-file" className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-white/20 rounded-xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] hover:border-teal-soft transition-all p-5 text-center overflow-hidden">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <HiOutlinePhotograph className="text-[40px] text-[var(--primary)]" />
                    <p className="text-sm font-semibold text-[var(--text-primary)] m-0">Thumbnail</p>
                    <span className="text-xs text-[var(--text-muted)]">16:9 recommended</span>
                  </div>
                )}
              </label>
              <input type="file" id="thumb-file" accept="image/*" onChange={handleThumbnailChange} hidden />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)] [&>label]:ml-1">
            <label htmlFor="video-title">Title</label>
            <input id="video-title" type="text" className="w-full bg-[var(--glass-border)] border border-white/10 rounded-xl px-4 py-3 text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-primary transition-colors" placeholder="Enter video title"
              value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
          </div>

          <div className="flex flex-col gap-1.5 [&>label]:text-[13px] [&>label]:font-medium [&>label]:text-[var(--text-secondary)] [&>label]:ml-1">
            <label htmlFor="video-desc">Description</label>
            <textarea id="video-desc" className="w-full bg-[var(--glass-border)] border border-white/10 rounded-xl px-4 py-3 text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-teal-primary transition-colors resize-y min-h-[100px]" placeholder="Tell viewers about your video"
              rows={4} value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})} required />
          </div>

          {uploading && (
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-teal-primary/10 border border-teal-primary/20">
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-teal-primary rounded-full relative shadow-[0_0_10px_#1DB8A8]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-[var(--primary-soft)] text-right">{progress}%</span>
            </div>
          )}

          <motion.button type="submit" className="btn-primary w-full md:w-auto py-3 px-6 justify-center flex items-center gap-2 text-[15px] cursor-pointer outline-none border-none mt-2"
            disabled={uploading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {uploading ? <><span className="w-5 h-5 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin inline-block" /> Uploading...</> : <><HiOutlineCloudUpload className="text-[18px]" /> Publish Video</>}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
