import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import axios from 'axios'
import {
  Upload, File, Copy, Check, Download, Clock, Shield,
  Trash2, Link2, QrCode, FileText, Image, Music, Video,
  Archive, Loader2, X, Eye, KeyRound
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith('image/')) return Image
  if (mimeType?.startsWith('video/')) return Video
  if (mimeType?.startsWith('audio/')) return Music
  if (mimeType?.includes('pdf') || mimeType?.includes('document')) return FileText
  if (mimeType?.includes('zip') || mimeType?.includes('compressed')) return Archive
  return File
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function FileSharePage() {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [otpInput, setOtpInput] = useState('')
  const [downloadedFile, setDownloadedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const [copied, setCopied] = useState({ otp: false, link: false })

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size exceeds 100MB limit')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_URL}/api/files/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        setUploadedFile(response.data.data)
        toast.success('File uploaded successfully!')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.error || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: loading
  })

  const copyOTP = async () => {
    if (!uploadedFile?.otp) return
    try {
      await navigator.clipboard.writeText(uploadedFile.otp)
      setCopied(prev => ({ ...prev, otp: true }))
      toast.success('OTP copied!')
      setTimeout(() => setCopied(prev => ({ ...prev, otp: false })), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const copyLink = async () => {
    if (!uploadedFile?.downloadUrl) return
    try {
      await navigator.clipboard.writeText(uploadedFile.downloadUrl)
      setCopied(prev => ({ ...prev, link: true }))
      toast.success('Link copied!')
      setTimeout(() => setCopied(prev => ({ ...prev, link: false })), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleDownload = async () => {
    if (!otpInput.trim() || otpInput.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      // First verify the OTP
      const verifyResponse = await axios.get(`${API_URL}/api/files/verify/${otpInput}`)

      if (verifyResponse.data.valid) {
        setDownloadedFile(verifyResponse.data.data)

        // Trigger download
        const link = document.createElement('a')
        link.href = `${API_URL}/api/files/download/${otpInput}`
        link.download = verifyResponse.data.data.originalName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success('Download started!')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error(error.response?.data?.error || 'Invalid OTP or file expired')
    } finally {
      setLoading(false)
    }
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setCopied({ otp: false, link: false })
  }

  const FileIcon = uploadedFile ? getFileIcon(uploadedFile.mimeType) : File

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
            <Shield className="w-4 h-4" />
            Secure & Anonymous File Sharing
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">File Sharing Hub</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Upload files and share them securely using OTP or QR codes. 
            Files auto-delete after 24 hours for maximum privacy.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="glass-panel p-1 flex gap-1">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('download')}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'download'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Download File
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'upload' ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {!uploadedFile ? (
                /* Upload Area */
                <div
                  {...getRootProps()}
                  className={`glass-panel p-12 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive
                      ? 'border-indigo-500/50 bg-indigo-500/5'
                      : 'border-dashed border-2 border-slate-700/50 hover:border-indigo-500/30'
                  }`}
                >
                  <input {...getInputProps()} />

                  {loading ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-slate-700/50" />
                        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                      </div>
                      <p className="text-slate-300 font-medium">Uploading your file...</p>
                      <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 animate-pulse rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Upload className="w-10 h-10 text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {isDragActive ? 'Drop your file here' : 'Drag & drop your file'}
                      </h3>
                      <p className="text-slate-400 mb-6">
                        or <span className="text-indigo-400 font-medium">click to browse</span>
                      </p>
                      <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Documents
                        </span>
                        <span className="flex items-center gap-1">
                          <Image className="w-3 h-3" /> Images
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" /> Videos
                        </span>
                        <span className="flex items-center gap-1">
                          <Archive className="w-3 h-3" /> Archives
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-4">Max file size: 100MB</p>
                    </>
                  )}
                </div>
              ) : (
                /* Upload Success */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-panel p-8"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <FileIcon className="w-7 h-7 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{uploadedFile.originalName}</h3>
                        <p className="text-sm text-slate-400">{formatSize(uploadedFile.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={resetUpload}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* OTP Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <KeyRound className="w-5 h-5 text-indigo-400" />
                        <h4 className="font-semibold text-white">Share Code (OTP)</h4>
                      </div>

                      <div className="bg-slate-900/80 rounded-xl p-6 text-center border border-indigo-500/20">
                        <div className="text-5xl font-mono font-bold text-indigo-400 tracking-[0.5em] mb-4">
                          {uploadedFile.otp}
                        </div>
                        <button
                          onClick={copyOTP}
                          className="btn-secondary text-sm flex items-center gap-2 mx-auto"
                        >
                          {copied.otp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          {copied.otp ? 'Copied!' : 'Copy OTP'}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        Expires in {uploadedFile.expiresIn}
                      </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="w-5 h-5 text-cyan-400" />
                        <h4 className="font-semibold text-white">QR Code</h4>
                      </div>

                      <div className="bg-white rounded-xl p-6 flex items-center justify-center">
                        <QRCodeSVG
                          value={uploadedFile.downloadUrl}
                          size={180}
                          level="H"
                          includeMargin={true}
                          bgColor="#ffffff"
                          fgColor="#0f172a"
                        />
                      </div>

                      <button
                        onClick={copyLink}
                        className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                      >
                        {copied.link ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                        {copied.link ? 'Link Copied!' : 'Copy Download Link'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* Download Tab */
            <motion.div
              key="download"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-panel p-8"
            >
              <div className="max-w-md mx-auto text-center">
                <div className="w-20 h-20 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Download className="w-10 h-10 text-cyan-400" />
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">Download File</h3>
                <p className="text-slate-400 mb-8">
                  Enter the 6-digit OTP or scan the QR code shared by the sender
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Enter 6-digit OTP
                    </label>
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setOtpInput(val)
                      }}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full glass-input text-center text-2xl font-mono tracking-[0.5em] py-4"
                    />
                  </div>

                  <button
                    onClick={handleDownload}
                    disabled={loading || otpInput.length !== 6}
                    className="w-full btn-accent flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    {loading ? 'Verifying...' : 'Download File'}
                  </button>
                </div>

                {downloadedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-emerald-400">Ready to download</p>
                        <p className="text-xs text-slate-400">{downloadedFile.originalName} ({formatSize(downloadedFile.size)})</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: Shield, title: 'Secure', desc: 'OTP & QR code protection' },
            { icon: Clock, title: 'Temporary', desc: 'Auto-deletes after 24 hours' },
            { icon: Eye, title: 'Anonymous', desc: 'No registration required' },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass-panel p-6 text-center"
              >
                <div className="w-12 h-12 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
