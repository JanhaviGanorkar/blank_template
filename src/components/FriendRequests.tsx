import { useState, useEffect } from 'react';
import { useFriendStore } from '../store/friendStore';
import { chatService } from '../api/apiclient';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  UserPlus, 
  Users, 
  Search, 
  Check, 
  X, 
  Clock, 
  Send,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface SearchUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
  is_friend?: boolean;
  friend_request_status?: 'sent' | 'received' | null;
}

export default function FriendRequests() {
  const {
    receivedRequests,
    sentRequests,
    friends,
    searchResults,
    requestCounts,
    loading,
    error,
    fetchReceivedRequests,
    fetchSentRequests,
    fetchFriends,
    fetchRequestCounts,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    clearError
  } = useFriendStore();

  const [activeTab, setActiveTab] = useState<'search' | 'received' | 'sent' | 'friends'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [friendRequestMessage, setFriendRequestMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [startingChatId, setStartingChatId] = useState<number | null>(null);

  // Load data when component mounts or tab changes
  useEffect(() => {
    fetchRequestCounts();
    if (activeTab === 'received') {
      fetchReceivedRequests();
    } else if (activeTab === 'sent') {
      fetchSentRequests();
    } else if (activeTab === 'friends') {
      fetchFriends();
    }
  }, [activeTab, fetchReceivedRequests, fetchSentRequests, fetchFriends, fetchRequestCounts]);

  // Handle search with debouncing
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, searchUsers]);

  // Handle send friend request
  const handleSendFriendRequest = async (userId: number) => {
    const success = await sendFriendRequest(userId, friendRequestMessage || 'Hi! I would like to be friends.');
    if (success) {
      setFriendRequestMessage('');
      setSelectedUser(null);
    }
  };

  // Handle accept friend request
  const handleAcceptRequest = async (requestId: string) => {
    await acceptFriendRequest(requestId);
  };

  // Handle reject friend request
  const handleRejectRequest = async (requestId: string) => {
    await rejectFriendRequest(requestId);
  };

  // Handle cancel friend request
  const handleCancelRequest = async (requestId: string) => {
    await cancelFriendRequest(requestId);
  };

  // Handle remove friend
  const handleStartChat = async (friendUserId: number) => {
    try {
      setStartingChatId(friendUserId);
      const chat = await chatService.createPersonalChat(friendUserId);
      console.log('Chat created:', chat);
      
      // Show success message with better UX
      const friendName = friends.find(f => f.friend.id === friendUserId)?.friend.name || 'friend';
      alert(`✅ Chat started with ${friendName}! Check your dashboard to start messaging.`);
      
      // Trigger a refresh of the dashboard chats (if callback provided)
      if (window.location.pathname === '/dashboard') {
        // Reload the page to refresh chats - you can improve this later
        window.location.reload();
      }
      
    } catch (error: any) {
      console.error('Failed to start chat:', error);
      
      // Handle different error types
      // if (error.response?.status === 500) {
      //   alert('⚠️ There was a server error. The chat feature is working but needs proper database models. Check the Django console for details.');
      // } else if (error.response?.status === 404) {
      //   alert('❌ Chat service not found. The chat feature may not be available yet.');
      // } else if (error.response?.status === 403) {
      //   alert('❌ You don\'t have permission to start a chat with this user.');
      // } else {
      //   alert('❌ Failed to start chat. Please check your internet connection and try again.');
      // }
    } finally {
      setStartingChatId(null);
    }
  };

  const handleRemoveFriend = async (userId: number) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      await removeFriend(userId);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get user avatar URL
  const getAvatarUrl = (user: any) => {
    return user.avatar_url || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 rounded-t-2xl text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Friend Connections</h1>
            <p className="text-blue-100">Manage relationships and connect with others</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {requestCounts.received_count > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {requestCounts.received_count} new {requestCounts.received_count === 1 ? 'request' : 'requests'}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
              onClick={() => window.history.back()}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto scrollbar-none border-b border-gray-200">
          <button 
            className={`flex items-center justify-center px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap ${activeTab === 'search' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('search')}
          >
            <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Find People
          </button>
          
          <button 
            className={`flex items-center justify-center px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap relative ${activeTab === 'received' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('received')}
          >
            <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Requests
            {requestCounts.received_count > 0 && (
              <span className="absolute top-2 sm:top-3 -right-1 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                {requestCounts.received_count > 9 ? '9+' : requestCounts.received_count}
              </span>
            )}
          </button>
          
          <button 
            className={`flex items-center justify-center px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap ${activeTab === 'sent' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('sent')}
          >
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Pending
          </button>
          
          <button 
            className={`flex items-center justify-center px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap ${activeTab === 'friends' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('friends')}
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Friends
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Content area with tabs */}
        <div className="flex-1 overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <div className="hidden">
              <TabsList>
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="received">Received</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="friends">Friends</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Search Tab */}
            <TabsContent value="search" className="focus:outline-none">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-none shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Searching for people...</p>
            </div>
          ) : searchQuery.length >= 2 && searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-800 font-medium">No results found</p>
              <p className="text-gray-500 text-sm mt-1">No users found matching "{searchQuery}"</p>
            </div>
          ) : searchQuery.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-800 font-medium">Search for friends</p>
              <p className="text-gray-500 text-sm mt-1">Enter at least 2 characters to search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {searchResults.map((user: SearchUser) => (
                <div 
                  key={user.id} 
                  className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 p-4 transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-gray-100">
                        <AvatarImage src={getAvatarUrl(user)} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    
                    <div>
                      {user.is_friend ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Friends
                        </Badge>
                      ) : user.friend_request_status === 'sent' ? (
                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                          <Clock className="w-3 h-3 mr-1" />
                          Request Sent
                        </Badge>
                      ) : user.friend_request_status === 'received' ? (
                        <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                          <Clock className="w-3 h-3 mr-1" />
                          Request Received
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => setSelectedUser(user)}
                          disabled={loading}
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          <UserPlus className="w-4 h-4 mr-1.5" />
                          Add Friend
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

              {/* Friend Request Modal */}
              {selectedUser && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white flex justify-between items-center">
                      <h3 className="font-semibold text-lg">Send Friend Request</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/20"
                        onClick={() => setSelectedUser(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-4 mb-6">
                        <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-blue-200">
                          <AvatarImage src={getAvatarUrl(selectedUser)} alt={selectedUser.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl">
                            {selectedUser.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{selectedUser.name}</p>
                          <p className="text-sm text-gray-500">{selectedUser.email}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Add a personal message
                        </label>
                        <Textarea
                          placeholder="Hi! I'd like to connect with you..."
                          value={friendRequestMessage}
                          onChange={(e) => setFriendRequestMessage(e.target.value)}
                          rows={3}
                          className="resize-none focus-visible:ring-2 focus-visible:ring-blue-500 border-gray-200"
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <Button
                          variant="outline"
                          className="sm:order-first order-last border-gray-300"
                          onClick={() => setSelectedUser(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSendFriendRequest(selectedUser.id)}
                          disabled={loading}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Request
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

        {/* Received Requests Tab */}
        <TabsContent value="received" className="focus:outline-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Loading friend requests...</p>
            </div>
          ) : (Array.isArray(receivedRequests) && receivedRequests.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-800 font-medium">No pending requests</p>
              <p className="text-gray-500 text-sm mt-1">When someone sends you a friend request, it will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                People who want to connect with you
              </h3>
            
              {(Array.isArray(receivedRequests) ? receivedRequests : []).map((request) => (
                <div key={request.id} 
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-1 items-start gap-3">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-offset-2 ring-blue-100 flex-shrink-0">
                        <AvatarImage src={getAvatarUrl(request.sender)} alt={request.sender.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {request.sender.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                          <p className="font-semibold text-gray-900">{request.sender.name}</p>
                          <p className="text-xs text-gray-500 sm:before:content-['•'] sm:before:mx-2 sm:before:text-gray-300">
                            {formatDate(request.created_at)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">{request.sender.email}</p>
                        {request.message && (
                          <div className="mt-3 bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-sm text-gray-600 italic">"{request.message}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col gap-2 sm:min-w-[120px]">
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={loading}
                        className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={loading}
                        className="flex-1 sm:flex-initial border-gray-300"
                      >
                        <X className="w-4 h-4 mr-1.5" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sent Requests Tab */}
        <TabsContent value="sent" className="focus:outline-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Loading sent requests...</p>
            </div>
          ) : (Array.isArray(sentRequests) && sentRequests.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-800 font-medium">No pending sent requests</p>
              <p className="text-gray-500 text-sm mt-1">Friend requests you've sent will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Pending sent requests
              </h3>
            
              {(Array.isArray(sentRequests) ? sentRequests : []).map((request) => (
                <div key={request.id} 
                  className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-gray-100">
                        <AvatarImage src={getAvatarUrl(request.receiver)} alt={request.receiver.name} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                          {request.receiver.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                          <p className="font-semibold text-gray-900">{request.receiver.name}</p>
                          <div className="flex items-center">
                            <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 ml-0 sm:ml-2">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{request.receiver.email}</p>
                        {request.message && (
                          <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-600 italic">"{request.message}"</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">Sent {formatDate(request.created_at)}</p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelRequest(request.id)}
                      disabled={loading}
                      className="sm:self-start flex-shrink-0 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Cancel Request
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Friends Tab */}
        <TabsContent value="friends" className="focus:outline-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Loading your friends...</p>
            </div>
          ) : (Array.isArray(friends) && friends.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-800 font-medium">No friends yet</p>
              <p className="text-gray-500 text-sm mt-1">Search for people to connect with</p>
              <Button 
                variant="outline"
                className="mt-4 border-blue-200 text-blue-700"
                onClick={() => setActiveTab('search')}
              >
                <Search className="w-4 h-4 mr-1.5" />
                Find Friends
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 flex items-center mb-4">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Your connections ({friends.length})
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {(Array.isArray(friends) ? friends : []).map((friendship) => (
                  <div key={friendship.id} 
                    className="bg-gradient-to-r from-blue-50 via-white to-purple-50 rounded-xl border border-blue-100/40 p-3 sm:p-4 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="relative">
                        <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-blue-100">
                          <AvatarImage src={getAvatarUrl(friendship.friend)} alt={friendship.friend.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {friendship.friend.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{friendship.friend.name}</h4>
                            <p className="text-sm text-gray-600">{friendship.friend.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center bg-blue-100/50 text-blue-700 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                            Friends since {new Date(friendship.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            onClick={() => handleStartChat(friendship.friend.id)}
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white whitespace-nowrap"
                            disabled={startingChatId === friendship.friend.id}
                          >
                            {startingChatId === friendship.friend.id ? (
                              <>
                                <div className="w-4 h-4 mr-1.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                Starting...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-1.5" />
                                Message
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFriend(friendship.friend.id)}
                            disabled={loading}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}