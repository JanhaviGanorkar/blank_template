import React, { useState, useRef, useEffect } from 'react'
import { useAuth, useChat } from '../store/store'
import { useWebSocket } from '../services/websocket'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { Textarea } from "../components/ui/textarea"
import FriendRequests from '../components/FriendRequests'
import { friendService } from '../api/apiclient'

export default function Dashboard() {
  const { isAuthenticated, user, logout } = useAuth()
  const { 
    chats, 
    currentChat, 
    isLoading, 
    error, 
    loadUserChats, 
    setCurrentChat,
    messages,
    sendMessage 
  } = useChat()
  const { connect, disconnect, connectionStatus, isConnected } = useWebSocket()
  const navigate = useNavigate()
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [showChatWindow, setShowChatWindow] = useState(false)
  const [hasConnectedWS, setHasConnectedWS] = useState(false)
  const [showFriendRequests, setShowFriendRequests] = useState(false)
  const [friendRequestCount, setFriendRequestCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chats and connect WebSocket on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 Loading user chats...')
      // Only load chats if the chat API is available
      loadUserChats().catch(error => {
        console.warn('⚠️ Chat API not available yet:', error);
        // Don't show error to user since chat feature might not be implemented yet
      });
      loadFriendRequestCount()
    }
  }, [isAuthenticated, user, loadUserChats])

  // Load friend request count
  const loadFriendRequestCount = async () => {
    try {
      const requests = await friendService.getFriendRequests('received')
      setFriendRequestCount(requests.length)
    } catch (error) {
      console.error('Failed to load friend request count:', error)
    }
  }

  // Connect WebSocket after chats are loaded and component is stable
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    
    if (isAuthenticated && user && !isLoading && !hasConnectedWS) {
      console.log('🔌 Preparing WebSocket connection...')
      // Delay to ensure authentication and component are fully stable
      timer = setTimeout(() => {
        const token = localStorage.getItem('access_token')
        if (token && connectionStatus === 'DISCONNECTED') {
          console.log('🔌 Starting WebSocket connection with token')
          connect()
          setHasConnectedWS(true)
        }
      }, 2000)
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [isAuthenticated, user, isLoading, hasConnectedWS, connectionStatus, connect])

  // Cleanup WebSocket on unmount only
  useEffect(() => {
    return () => {
      console.log('🔌 Disconnecting WebSocket on unmount')
      disconnect()
    }
  }, []) // Empty dependency array to only run on unmount

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentChat, messages])

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileDropdownOpen(false)
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setIsProfileDropdownOpen(false)
    setIsMobileMenuOpen(false)
  }

  const handleChatSelect = (chat: any) => {
    setCurrentChat(chat)
    setShowChatWindow(true)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !currentChat) return

    try {
      await sendMessage(currentChat.id, messageInput.trim())
      setMessageInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  // Filter chats based on search
  const filteredChats = (chats || []).filter(chat =>
    chat.other_user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Chat Dashboard Header - Matching Navbar Design */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="hidden sm:block text-lg lg:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  ChatApp
                </span>
              </Link>
              
              {/* Connection Status */}
              <div className={`hidden md:flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${
                connectionStatus === 'CONNECTED' 
                  ? 'bg-green-100 text-green-800' 
                  : connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'CONNECTED' 
                    ? 'bg-green-500' 
                    : connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
                }`}></div>
                <span className="capitalize">{connectionStatus.toLowerCase()}</span>
              </div>
            </div>

            {/* User Profile - Matching Navbar Style */}
            <div className="flex items-center space-x-2 min-w-0">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 border border-gray-200/50 hover:border-blue-300/50 transition-all duration-300"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Friend Requests Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFriendRequests(!showFriendRequests)}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 border border-gray-200/50 hover:border-blue-300/50 transition-all duration-300 transform hover:scale-[1.05] shadow-sm hover:shadow-md group"
                  title="Friend Requests"
                >
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  
                  {/* Notification Badge */}
                  {friendRequestCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
                      {friendRequestCount > 9 ? '9+' : friendRequestCount}
                    </div>
                  )}
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 border border-gray-200/50 hover:border-blue-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-sm hover:shadow-md"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="hidden lg:flex flex-col items-start min-w-0">
                    <span className="font-semibold text-gray-800 text-sm truncate max-w-24">{user?.name}</span>
                    <span className="text-xs text-gray-500">Online</span>
                  </div>
                  <svg className={`hidden sm:block w-4 h-4 text-gray-600 transition-transform duration-200 flex-shrink-0 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Enhanced Dropdown Menu - Matching Navbar Style */}
                {isProfileDropdownOpen && (
                  <div ref={dropdownRef} className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user?.name}</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-all duration-200 group"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile Settings
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-all duration-200 group"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                    </div>

                    <div className="my-2 border-t border-gray-100"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 transition-all duration-200 group"
                    >
                      <svg className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu - Matching Navbar Style */}
          {isMobileMenuOpen && (
            <div ref={mobileMenuRef} className="sm:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50 px-4 py-4 space-y-3 shadow-xl">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200/50 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-sm text-gray-600 truncate">{user?.email}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        connectionStatus === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <p className="text-xs text-green-600 font-medium">
                        {connectionStatus === 'CONNECTED' ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Chat Interface */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Friend Requests Overlay */}
        {showFriendRequests && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Close button */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Friends & Connections</h2>
                <button
                  onClick={() => {
                    setShowFriendRequests(false)
                    loadFriendRequestCount() // Refresh count when closing
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Friend Requests Component */}
              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                <FriendRequests />
              </div>
            </div>
          </div>
        )}

        {/* Chat List Sidebar */}
        <div className={`${showChatWindow ? 'hidden lg:flex' : 'flex'} lg:w-1/3 xl:w-1/4 flex-col bg-white border-r border-gray-200`}>
          {/* Search Bar */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading chats...</span>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                <p className="text-sm text-center">Start a new conversation to begin chatting</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div 
                  key={chat.id} 
                  className={`flex items-center px-4 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    currentChat?.id === chat.id ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
                  }`}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {chat.other_user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  </div>
                  
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {chat.other_user?.name || 'Unknown User'}
                      </h3>
                      {chat.last_message && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(chat.last_message.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {chat.last_message ? chat.last_message.content : 'No messages yet'}
                    </p>
                  </div>
                  
                  {chat.unread_count > 0 && (
                    <div className="ml-2 flex-shrink-0">
                      <Badge variant="default" className="bg-blue-600 text-white">
                        {chat.unread_count > 99 ? '99+' : chat.unread_count}
                      </Badge>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`${!showChatWindow ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-gray-50`}>
          {currentChat ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChatWindow(false)}
                    className="lg:hidden p-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </Button>
                  
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {currentChat.other_user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {currentChat.other_user?.name || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-gray-500">Online</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages[currentChat.id]?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="text-4xl mb-4">💬</div>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages[currentChat.id]?.map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_own_message ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.is_own_message
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.is_own_message ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  )) || []
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-3">
                  <Textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Message ${currentChat.other_user?.name || 'user'}...`}
                    className="flex-1 resize-none min-h-[40px] max-h-[120px]"
                    rows={1}
                    onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e as any)
                      }
                    }}
                  />
                  <Button 
                    type="submit" 
                    disabled={!messageInput.trim()}
                    className="px-6 py-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a chat from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
