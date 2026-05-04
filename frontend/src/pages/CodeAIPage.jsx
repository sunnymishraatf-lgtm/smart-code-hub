import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import toast from 'react-hot-toast'
import {
  Play, Wand2, BookOpen, Copy, Check, Send, Loader2,
  Code2, Terminal, MessageSquare, Sparkles, Download,
  ChevronDown, Settings, Languages
} from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const languages = [
  { id: 'javascript', label: 'JavaScript', icon: 'JS' },
  { id: 'python', label: 'Python', icon: 'PY' },
  { id: 'java', label: 'Java', icon: 'JV' },
  { id: 'cpp', label: 'C++', icon: 'C+' },
  { id: 'csharp', label: 'C#', icon: 'C#' },
  { id: 'typescript', label: 'TypeScript', icon: 'TS' },
  { id: 'go', label: 'Go', icon: 'GO' },
  { id: 'rust', label: 'Rust', icon: 'RS' },
  { id: 'php', label: 'PHP', icon: 'PH' },
  { id: 'ruby', label: 'Ruby', icon: 'RB' },
  { id: 'swift', label: 'Swift', icon: 'SW' },
  { id: 'kotlin', label: 'Kotlin', icon: 'KT' },
  { id: 'vhdl', label: 'VHDL', icon: 'VH' },
  { id: 'sql', label: 'SQL', icon: 'SQ' },
  { id: 'html', label: 'HTML', icon: 'HT' },
  { id: 'css', label: 'CSS', icon: 'CS' },
]

const actions = [
  { id: 'generate', label: 'Generate', icon: Sparkles, color: 'from-indigo-600 to-purple-600' },
  { id: 'fix', label: 'Fix Code', icon: Wand2, color: 'from-emerald-600 to-teal-600' },
  { id: 'explain', label: 'Explain', icon: BookOpen, color: 'from-cyan-600 to-blue-600' },
]

export default function CodeAIPage() {
  const [code, setCode] = useState('// Welcome to Smart Code Hub AI!\n// Describe what you want to build or paste code to fix/explain...')
  const [language, setLanguage] = useState('javascript')
  const [prompt, setPrompt] = useState('')
  const [action, setAction] = useState('generate')
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState('')
  const [explanation, setExplanation] = useState('')
  const [copied, setCopied] = useState(false)
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const editorRef = useRef(null)

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor
  }

  const handleAction = async (actionType) => {
    if (!prompt.trim() && actionType === 'generate') {
      toast.error('Please enter a description or question')
      return
    }
    if (!code.trim() && (actionType === 'fix' || actionType === 'explain')) {
      toast.error('Please paste some code first')
      return
    }

    setLoading(true)
    setAction(actionType)
    setOutput('')
    setExplanation('')

    try {
      const response = await axios.post(`${API_URL}/api/code/generate`, {
        prompt: prompt || (actionType === 'generate' ? 'Generate code' : 'Fix/explain this code'),
        language,
        action: actionType,
        code
      })

      if (response.data.success) {
        const { codeBlocks, explanation: expl } = response.data

        if (codeBlocks.length > 0) {
          setCode(codeBlocks[0].code)
          setOutput('Code generated successfully!')
        }

        if (expl) {
          setExplanation(expl)
        }

        toast.success(
          actionType === 'generate' ? 'Code generated!' : 
          actionType === 'fix' ? 'Code fixed!' : 'Explanation ready!'
        )
      }
    } catch (error) {
      console.error('AI Error:', error)
      toast.error(error.response?.data?.error || 'Failed to process request')
    } finally {
      setLoading(false)
    }
  }

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('No code to run')
      return
    }

    setLoading(true)
    setOutput('Running...')

    try {
      const response = await axios.post(`${API_URL}/api/code/run`, {
        code,
        language
      })

      if (response.data.success) {
        setOutput(response.data.output)
        toast.success('Code executed!')
      }
    } catch (error) {
      setOutput(`Error: ${error.response?.data?.error || error.message}`)
      toast.error('Execution failed')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const downloadCode = () => {
    const extensions = {
      javascript: 'js', python: 'py', java: 'java', cpp: 'cpp',
      csharp: 'cs', typescript: 'ts', go: 'go', rust: 'rs',
      php: 'php', ruby: 'rb', swift: 'swift', kotlin: 'kt',
      vhdl: 'vhd', sql: 'sql', html: 'html', css: 'css'
    }

    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${extensions[language] || 'txt'}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('File downloaded!')
  }

  const selectedLang = languages.find(l => l.id === language)

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Code2 className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">AI Code Assistant</h1>
          </div>
          <p className="text-slate-400 ml-11">Generate, fix, and explain code with AI-powered intelligence</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Editor */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Toolbar */}
            <div className="glass-panel p-4 flex flex-wrap items-center gap-3">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <Languages className="w-4 h-4" />
                  {selectedLang?.label || 'JavaScript'}
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showLangDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 min-w-[240px] w-max glass-panel max-h-64 overflow-y-auto z-[9999] p-2"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => {
                            setLanguage(lang.id)
                            setShowLangDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm whitespace-nowrap flex items-center gap-2 hover:bg-white/5 transition-colors ${
                            language === lang.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'
                          }`}
                        >
                          <span className="text-xs font-mono opacity-50 w-6">{lang.icon}</span>
                          {lang.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1" />

              {/* Action Buttons */}
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/50 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>

              <button
                onClick={downloadCode}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/50 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Save
              </button>
            </div>

            {/* Editor */}
            <div className="glass-panel" style={{ height: '500px' }}>
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={setCode}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, Fira Code, monospace',
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                  padding: { top: 16 },
                  folding: true,
                  renderLineHighlight: 'all',
                  matchBrackets: 'always',
                  tabSize: 2,
                }}
                loading={
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading editor...
                  </div>
                }
              />
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunCode}
              disabled={loading}
              className="w-full btn-accent flex items-center justify-center gap-2"
            >
              {loading && action === 'run' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Run Code
            </button>
          </motion.div>

          {/* Right Panel - Controls & Output */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {/* Prompt Input */}
            <div className="glass-panel p-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                What do you want to do?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Create a React component with useState hook, or describe the bug you want to fix..."
                className="w-full glass-input min-h-[100px] resize-none"
              />

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {actions.map((act) => {
                  const Icon = act.icon
                  return (
                    <button
                      key={act.id}
                      onClick={() => handleAction(act.id)}
                      disabled={loading}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                        action === act.id 
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-white' 
                          : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      {loading && action === act.id ? (
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                      <span className="text-sm font-medium">{act.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Output Panel */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Output</h3>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-4 min-h-[200px] max-h-[300px] overflow-auto font-mono text-sm">
                {output ? (
                  <pre className="text-slate-300 whitespace-pre-wrap">{output}</pre>
                ) : (
                  <div className="text-slate-600 text-center py-8">
                    Output will appear here after running code
                  </div>
                )}
              </div>
            </div>

            {/* Explanation Panel */}
            <AnimatePresence>
              {explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-panel p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">Explanation</h3>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {explanation}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
