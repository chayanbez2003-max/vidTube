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
    <div className="max-w-[1280px] mx-auto p-3 sm:p-5 md:p-8">
      <motion.div
        className="w-full max-w-[820px] mx-auto bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 md:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3.5 mb-7 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-md shadow-sky-500/25">
            <HiOutlineCloudUpload />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 m-0">Upload Video</h1>
            <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5">Share your content with the VidTube community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Video File Upload */}
            <div className="flex flex-col w-full h-[210px]">
              <label
                htmlFor="video-file"
                className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-2xl cursor-pointer transition-all p-5 text-center ${
                  videoFile
                    ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20'
                    : 'border-slate-300 bg-slate-50/60 hover:bg-sky-50/40 hover:border-sky-400'
                }`}
              >
                {videoFile ? (
                  <div className="flex flex-col items-center text-center gap-2 w-full truncate">
                    <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center text-2xl shadow-md">
                      <HiOutlinePlay />
                    </div>
                    <p className="text-sm font-bold text-slate-900 m-0 truncate w-full px-2">{videoFile.name}</p>
                    <span className="text-xs font-semibold text-sky-600 bg-sky-100 px-2.5 py-0.5 rounded-full">
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB • Click to change
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-2xl">
                      <HiOutlineCloudUpload />
                    </div>
                    <p className="text-sm font-bold text-slate-800 m-0">Select Video File</p>
                    <span className="text-xs text-slate-400">MP4, WebM, MOV up to 500MB</span>
                  </div>
                )}
              </label>
              <input type="file" id="video-file" accept="video/*" onChange={handleVideoChange} hidden />
            </div>

            {/* Thumbnail Upload */}
            <div className="flex flex-col w-full h-[210px]">
              <label
                htmlFor="thumb-file"
                className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-2xl cursor-pointer transition-all p-3 text-center overflow-hidden ${
                  thumbnailPreview
                    ? 'border-indigo-500 bg-indigo-50/30'
                    : 'border-slate-300 bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-400'
                }`}
              >
                {thumbnailPreview ? (
                  <div className="relative w-full h-full rounded-xl overflow-hidden group">
                    <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                      Click to change
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-2">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl">
                      <HiOutlinePhotograph />
                    </div>
                    <p className="text-sm font-bold text-slate-800 m-0">Select Thumbnail</p>
                    <span className="text-xs text-slate-400">16:9 ratio recommended</span>
                  </div>
                )}
              </label>
              <input type="file" id="thumb-file" accept="image/*" onChange={handleThumbnailChange} hidden />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="video-title" className="text-xs sm:text-[13px] font-semibold text-slate-700 ml-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="video-title"
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all shadow-sm"
              placeholder="Give your video a catchy title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="video-desc" className="text-xs sm:text-[13px] font-semibold text-slate-700 ml-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="video-desc"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all resize-y min-h-[110px] shadow-sm"
              placeholder="Tell viewers what your video is about..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="video-tags" className="text-xs sm:text-[13px] font-semibold text-slate-700 ml-1">
                Tags
              </label>
              <input
                id="video-tags"
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all shadow-sm"
                placeholder="tech, gaming, vlog (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="video-category" className="text-xs sm:text-[13px] font-semibold text-slate-700 ml-1">
                Category
              </label>
              <select
                id="video-category"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all shadow-sm"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="entertainment">Entertainment</option>
                <option value="gaming">Gaming</option>
                <option value="education">Education</option>
                <option value="music">Music</option>
                <option value="technology">Technology</option>
                <option value="news">News & Politics</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {uploading && (
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-sky-50 border border-sky-200">
              <div className="flex items-center justify-between text-xs font-bold text-sky-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
                  Uploading video...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-sky-200/60 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <motion.button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-600 hover:via-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 cursor-pointer border-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={uploading}
              whileHover={{ scale: uploading ? 1 : 1.01 }}
              whileTap={{ scale: uploading ? 1 : 0.98 }}
            >
              {uploading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                  Publishing Video...
                </>
              ) : (
                <>
                  <HiOutlineCloudUpload className="text-xl" />
                  Publish Video
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
