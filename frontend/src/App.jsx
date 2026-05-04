import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import CodeAIPage from './pages/CodeAIPage'
import LiveSharePage from './pages/LiveSharePage'
import FileSharePage from './pages/FileSharePage'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/code-ai" element={<CodeAIPage />} />
          <Route path="/live-share" element={<LiveSharePage />} />
          <Route path="/live-share/:roomId" element={<LiveSharePage />} />
          <Route path="/file-share" element={<FileSharePage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
