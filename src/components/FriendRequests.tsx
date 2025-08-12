import { useState, useEffect } from 'react';
import { useFriendStore } from '../store/friendStore';
import { chatService } from '../api/apiclient';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Friend Requests</h1>
        <p className="text-gray-600">Manage your friendships and connect with others</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Users
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Received ({requestCounts.received_count})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Sent ({requestCounts.sent_count})
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Friends ({friends.length})
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Find Friends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>

              {loading && (
                <div className="text-center py-4 text-gray-500">
                  Searching...
                </div>
              )}

              <div className="space-y-3">
                {searchResults.map((user: SearchUser) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={getAvatarUrl(user)} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.is_friend ? (
                        <Badge variant="secondary">Already Friends</Badge>
                      ) : user.friend_request_status === 'sent' ? (
                        <Badge variant="outline">Request Sent</Badge>
                      ) : user.friend_request_status === 'received' ? (
                        <Badge variant="outline">Request Received</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          disabled={loading}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add Friend
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </CardContent>
          </Card>

          {/* Send Friend Request Modal */}
          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle>Send Friend Request to {selectedUser.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Add a personal message (optional)..."
                  value={friendRequestMessage}
                  onChange={(e) => setFriendRequestMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSendFriendRequest(selectedUser.id)}
                    disabled={loading}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send Request
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Received Requests Tab */}
        <TabsContent value="received" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Received Friend Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              ) : (Array.isArray(receivedRequests) && receivedRequests.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  No pending friend requests
                </div>
              ) : (
                <div className="space-y-3">
                  {(Array.isArray(receivedRequests) ? receivedRequests : []).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={getAvatarUrl(request.sender)} alt={request.sender.name} />
                          <AvatarFallback>{request.sender.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.sender.name}</p>
                          <p className="text-sm text-gray-500">{request.sender.email}</p>
                          {request.message && (
                            <p className="text-sm text-gray-600 mt-1 italic">"{request.message}"</p>
                          )}
                          <p className="text-xs text-gray-400">{formatDate(request.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={loading}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={loading}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sent Requests Tab */}
        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Sent Friend Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              ) : (Array.isArray(sentRequests) && sentRequests.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  No pending sent requests
                </div>
              ) : (
                <div className="space-y-3">
                  {(Array.isArray(sentRequests) ? sentRequests : []).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={getAvatarUrl(request.receiver)} alt={request.receiver.name} />
                          <AvatarFallback>{request.receiver.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.receiver.name}</p>
                          <p className="text-sm text-gray-500">{request.receiver.email}</p>
                          {request.message && (
                            <p className="text-sm text-gray-600 mt-1 italic">"{request.message}"</p>
                          )}
                          <p className="text-xs text-gray-400">{formatDate(request.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Pending</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Friends Tab */}
        <TabsContent value="friends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              ) : (Array.isArray(friends) && friends.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  No friends yet. Start by searching for users to add!
                </div>
              ) : (
                <div className="space-y-3">
                  {(Array.isArray(friends) ? friends : []).map((friendship) => (
                    <div key={friendship.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={getAvatarUrl(friendship.friend)} alt={friendship.friend.name} />
                          <AvatarFallback>{friendship.friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{friendship.friend.name}</p>
                          <p className="text-sm text-gray-500">{friendship.friend.email}</p>
                          <p className="text-xs text-gray-400">Friends since {formatDate(friendship.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleStartChat(friendship.friend.id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={startingChatId === friendship.friend.id}
                        >
                          {startingChatId === friendship.friend.id ? (
                            <>
                              <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Starting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1" />
                              Start Chat
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveFriend(friendship.friend.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}