import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import {
  Users, Copy, Check, Share2, MessageSquare, PenTool, Eraser,
  Trash2, Send, Loader2, ArrowLeft, Palette, MousePointer,
  Type, Square, Circle, Minus, Undo, Download, Maximize2
} from 'lucide-react'

useEffect(() => {
  const socket = io(import.meta.env.VITE_SOCKET_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true
  });

  return () => socket.disconnect();
}, []);

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'
]

const TOOLS = [
  { id: 'pen', icon: PenTool, label: 'Pen' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
]

export default function LiveSharePage() {
  const { roomId: urlRoomId } = useParams()
  const navigate = useNavigate()

  const [roomId, setRoomId] = useState(urlRoomId || '')
  const [userName, setUserName] = useState('')
  const [joined, setJoined] = useState(false)
  const [socket, setSocket] = useState(null)
  const [code, setCode] = useState('// Welcome to the collaboration room!\n// Start coding together...')
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#6366f1')
  const [brushSize, setBrushSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [language, setLanguage] = useState('javascript')

  const canvasRef = useRef(null)
  const editorRef = useRef(null)
  const chatEndRef = useRef(null)
  const canvasContainerRef = useRef(null)

  // Initialize socket
  useEffect(() => {
    if (!joined) return

    const newSocket = io(SOCKET_URL)
    setSocket(newSocket)

    newSocket.emit('join-room', roomId || generateRoomId(), {
      name: userName || 'Anonymous',
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    })

    newSocket.on('room-state', (state) => {
      setCode(state.code)
      setMessages(state.messages)
      setUsers(state.users)
      if (state.roomId) setRoomId(state.roomId)

      // Restore canvas
      if (state.canvas.length > 0 && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        state.canvas.forEach(draw => redrawStroke(ctx, draw))
      }
    })

    newSocket.on('user-joined', (data) => {
      setUsers(data.users)
      toast.success(data.message)
    })

    newSocket.on('user-left', (data) => {
      setUsers(data.users)
      toast(data.message, { icon: '👋' })
    })

    newSocket.on('code-update', (data) => {
      if (data.userId !== newSocket.id) {
        setCode(data.code)
      }
    })

    newSocket.on('canvas-update', (data) => {
      if (canvasRef.current && data.userId !== newSocket.id) {
        const ctx = canvasRef.current.getContext('2d')
        redrawStroke(ctx, data)
      }
    })

    newSocket.on('canvas-cleared', () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
      toast.success('Canvas cleared')
    })

    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message])
    })

    return () => {
      newSocket.close()
    }
  }, [joined])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  const handleJoin = () => {
    if (!userName.trim()) {
      toast.error('Please enter your name')
      return
    }
    const rid = roomId || generateRoomId()
    setRoomId(rid)
    setJoined(true)
    navigate(`/live-share/${rid}`, { replace: true })
  }

  const handleCodeChange = (value) => {
    setCode(value)
    if (socket) {
      socket.emit('code-change', { 
        code: value,
        cursorPosition: editorRef.current?.getPosition()
      })
    }
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!chatInput.trim() || !socket) return

    socket.emit('chat-message', { text: chatInput })
    setChatInput('')
  }

  const copyRoomLink = async () => {
    const link = `${window.location.origin}/live-share/${roomId}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Room link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  // Canvas drawing handlers
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  const startDrawing = (e) => {
    setIsDrawing(true)
    const { x, y } = getCanvasPos(e)

    if (tool === 'text') {
      const text = prompt('Enter text:')
      if (text) {
        const drawData = {
          type: 'text',
          x, y, text, color, fontSize: brushSize * 5 + 10,
          userId: socket?.id
        }
        drawOnCanvas(drawData)
        socket?.emit('canvas-draw', drawData)
      }
      setIsDrawing(false)
      return
    }

    const drawData = {
      type: tool,
      points: [{ x, y }],
      color: tool === 'eraser' ? '#0f172a' : color,
      size: brushSize,
      userId: socket?.id
    }

    canvasRef.current.lastDrawData = drawData
  }

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current.lastDrawData) return

    const { x, y } = getCanvasPos(e)
    const drawData = canvasRef.current.lastDrawData
    drawData.points.push({ x, y })

    const ctx = canvasRef.current.getContext('2d')
    redrawStroke(ctx, drawData)

    // Throttle socket emits
    if (drawData.points.length % 5 === 0) {
      socket?.emit('canvas-draw', { ...drawData, points: [...drawData.points] })
    }
  }

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current.lastDrawData) {
      socket?.emit('canvas-draw', canvasRef.current.lastDrawData)
      canvasRef.current.lastDrawData = null
    }
    setIsDrawing(false)
  }

  const drawOnCanvas = (data) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    redrawStroke(ctx, data)
  }

  const redrawStroke = (ctx, data) => {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (data.type === 'text') {
      ctx.font = `${data.fontSize || 20}px sans-serif`
      ctx.fillStyle = data.color
      ctx.fillText(data.text, data.x, data.y)
      return
    }

    if (data.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = data.size * 5
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = data.size
      ctx.strokeStyle = data.color
    }

    if (data.type === 'line' && data.points.length >= 2) {
      ctx.beginPath()
      ctx.moveTo(data.points[0].x, data.points[0].y)
      ctx.lineTo(data.points[data.points.length - 1].x, data.points[data.points.length - 1].y)
      ctx.stroke()
    } else if (data.type === 'rect' && data.points.length >= 2) {
      const start = data.points[0]
      const end = data.points[data.points.length - 1]
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
    } else if (data.type === 'circle' && data.points.length >= 2) {
      const start = data.points[0]
      const end = data.points[data.points.length - 1]
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
      ctx.beginPath()
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(data.points[0].x, data.points[0].y)
      for (let i = 1; i < data.points.length; i++) {
        ctx.lineTo(data.points[i].x, data.points[i].y)
      }
      ctx.stroke()
    }
  }

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    socket?.emit('canvas-clear')
    toast.success('Canvas cleared')
  }

  const downloadCanvas = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.download = `whiteboard-${roomId}.png`
      link.href = canvasRef.current.toDataURL()
      link.click()
      toast.success('Whiteboard saved!')
    }
  }

  // Setup canvas size
  useEffect(() => {
    if (!joined || !canvasContainerRef.current) return

    const resizeCanvas = () => {
      if (canvasRef.current && canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect()
        canvasRef.current.width = rect.width
        canvasRef.current.height = rect.height
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [joined])

  // Join Screen
  if (!joined) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 max-w-md w-full mx-4"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Join Collaboration Room</h1>
            <p className="text-slate-400">Enter your name to start collaborating</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full glass-input"
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Room ID (optional)
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Leave empty to create new room"
                className="w-full glass-input"
              />
            </div>

            <button
              onClick={handleJoin}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              {roomId ? 'Join Room' : 'Create Room'}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="pt-16 h-screen flex flex-col">
      {/* Toolbar */}
      <div className="glass-panel mx-4 mt-4 px-4 py-2 flex flex-wrap items-center gap-4">
        <button
          onClick={() => { setJoined(false); navigate('/live-share') }}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>

        <div className="h-6 w-px bg-slate-700" />

        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-medium text-white">{users.length}</span>
        </div>

        <div className="flex -space-x-2">
          {users.slice(0, 5).map((user, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
          ))}
          {users.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white border-2 border-slate-900">
              +{users.length - 5}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-700" />

        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5">
          <span className="text-xs text-slate-400">Room:</span>
          <code className="text-sm font-mono text-cyan-400">{roomId}</code>
          <button
            onClick={copyRoomLink}
            className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-2 rounded-lg transition-colors ${showChat ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Code Editor */}
        <motion.div 
          className="flex-1 glass-panel overflow-hidden flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="px-4 py-2 border-b border-slate-700/50 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-slate-300">Code Editor</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="ml-auto bg-slate-800/50 text-xs text-slate-300 rounded px-2 py-1 border border-slate-700/50"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="typescript">TypeScript</option>
            </select>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              onMount={(editor) => { editorRef.current = editor }}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 8 },
              }}
            />
          </div>
        </motion.div>

        {/* Whiteboard & Chat */}
        <motion.div 
          className="flex-1 flex flex-col gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {/* Whiteboard */}
          <div className="flex-1 glass-panel overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b border-slate-700/50 flex items-center gap-2 flex-wrap">
              <Palette className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Whiteboard</span>

              <div className="flex items-center gap-1 ml-4">
                {TOOLS.map((t) => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTool(t.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        tool === t.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={t.label}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-1 ml-2">
                {COLORS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      color === c ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-20 ml-2"
              />

              <div className="flex-1" />

              <button onClick={clearCanvas} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Clear">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={downloadCanvas} className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors" title="Download">
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div ref={canvasContainerRef} className="flex-1 relative bg-slate-950/50">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair"
              />
            </div>
          </div>

          {/* Chat */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: '280px' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-panel flex flex-col overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-slate-700/50 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Chat</span>
                  <span className="text-xs text-slate-500 ml-auto">{messages.length} messages</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                  {messages.length === 0 && (
                    <div className="text-center text-slate-600 text-sm py-8">
                      No messages yet. Start the conversation!
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: msg.userColor }}
                      >
                        {msg.user?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium" style={{ color: msg.userColor }}>
                            {msg.user}
                          </span>
                          <span className="text-xs text-slate-600">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 break-words">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-700/50 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 glass-input py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="btn-primary px-4 py-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
