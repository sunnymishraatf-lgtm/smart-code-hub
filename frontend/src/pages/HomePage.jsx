import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Code2, Users, FileUp, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'

const features = [
  {
    icon: Code2,
    title: 'AI Code Assistant',
    description: 'Generate, fix, and explain code in any language with AI-powered intelligence.',
    path: '/code-ai',
    color: 'from-indigo-600 to-purple-600',
    iconBg: 'bg-indigo-500/20',
  },
  {
    icon: Users,
    title: 'Live Collaboration',
    description: 'Real-time shared workspace with code editing, whiteboard, and chat.',
    path: '/live-share',
    color: 'from-cyan-600 to-blue-600',
    iconBg: 'bg-cyan-500/20',
  },
  {
    icon: FileUp,
    title: 'Secure File Sharing',
    description: 'Share files with OTP and QR code protection. Auto-destruct after 24 hours.',
    path: '/file-share',
    color: 'from-emerald-600 to-teal-600',
    iconBg: 'bg-emerald-500/20',
  },
]

const stats = [
  { label: 'Code Languages', value: '50+' },
  { label: 'Active Rooms', value: '∞' },
  { label: 'File Size Limit', value: '100MB' },
]

export default function HomePage() {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Developer Platform
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
                Code Smarter.
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Collaborate Faster.
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              The all-in-one platform for developers. AI code assistance, real-time collaboration, 
              and secure file sharing — all in one beautiful workspace.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/code-ai" className="btn-primary flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5" />
                Start Coding
              </Link>
              <Link to="/live-share" className="btn-secondary flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Join Room
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-slate-400">Powerful tools designed for modern developers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                >
                  <Link to={feature.path} className="block group">
                    <div className="glass-panel p-8 h-full hover:border-indigo-500/40 transition-all duration-500 hover:transform hover:-translate-y-1">
                      <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                      <p className="text-slate-400 mb-6 leading-relaxed">{feature.description}</p>
                      <div className="flex items-center text-indigo-400 text-sm font-medium group-hover:text-indigo-300 transition-colors">
                        Get Started <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure by Default</h3>
              <p className="text-slate-400 text-sm">End-to-end encryption for all file transfers and communications</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-slate-400 text-sm">Optimized for speed with real-time sync and instant AI responses</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Powered</h3>
              <p className="text-slate-400 text-sm">Cutting-edge AI models for code generation, debugging, and explanation</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
