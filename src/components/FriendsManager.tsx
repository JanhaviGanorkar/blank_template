import { useState, useEffect } from 'react';
import { friendService } from '../api/apiclient';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
// import { useAuth } from '../store/store';

interface FriendRequest {
  id: string;
  sender: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  receiver: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  status: string;
  message: string;
  created_at: string;
}

interface Friend {
  id: string;
  friend: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  created_at: string;
}

interface SearchUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  is_friend: boolean;
  friend_request_status?: 'sent' | 'received' | null;
}

export default function FriendsManager() {
  // const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  // Load friends on component mount
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await friendService.getFriends();
      setFriends(response);
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const [received, sent] = await Promise.all([
        friendService.getFriendRequests('received'),
        friendService.getFriendRequests('sent')
      ]);
      setFriendRequests(received);
      setSentRequests(sent);
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await friendService.searchUsers(searchQuery);
      setSearchResults(response);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: number) => {
    try {
      await friendService.sendFriendRequest(userId, requestMessage);
      setRequestMessage('');
      // Refresh search to update status
      searchUsers();
      alert('Friend request sent successfully!');
    } catch (error) {
      console.error('Failed to send friend request:', error);
      alert('Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      await friendService.acceptFriendRequest(requestId);
      loadFriendRequests();
      loadFriends();
      alert('Friend request accepted!');
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      alert('Failed to accept friend request');
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      await friendService.rejectFriendRequest(requestId);
      loadFriendRequests();
      alert('Friend request rejected');
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      alert('Failed to reject friend request');
    }
  };

  const removeFriend = async (userId: number) => {
    if (confirm('Are you sure you want to remove this friend?')) {
      try {
        await friendService.removeFriend(userId);
        loadFriends();
        alert('Friend removed successfully');
      } catch (error) {
        console.error('Failed to remove friend:', error);
        alert('Failed to remove friend');
      }
    }
  };

  const getUserAvatar = (user: any) => {
    if (user.avatar) return user.avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Friends & Connections</h1>
          <p className="text-gray-600">Manage your friendships and connect with others</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex px-6">
            {[
              { id: 'friends', label: 'Friends', count: friends.length },
              { id: 'requests', label: 'Requests', count: friendRequests.length },
              { id: 'search', label: 'Find People', count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <Badge variant="secondary" className="ml-2">
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading friends...</p>
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No friends yet</h3>
                  <p className="text-gray-600 mb-4">Start connecting with people to build your network</p>
                  <Button onClick={() => setActiveTab('search')}>Find People</Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {friends.map((friendship) => (
                    <div key={friendship.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <img
                          src={getUserAvatar(friendship.friend)}
                          alt={friendship.friend.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{friendship.friend.name}</h4>
                          <p className="text-sm text-gray-600">{friendship.friend.email}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => {/* Navigate to chat */}}
                        >
                          Chat
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFriend(friendship.friend.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Friend Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Received Requests */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Received Requests</h3>
                {friendRequests.length === 0 ? (
                  <p className="text-gray-600">No pending friend requests</p>
                ) : (
                  <div className="space-y-4">
                    {friendRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={getUserAvatar(request.sender)}
                            alt={request.sender.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{request.sender.name}</h4>
                            <p className="text-sm text-gray-600">{request.sender.email}</p>
                            {request.message && (
                              <p className="text-sm text-gray-700 mt-1 italic">"{request.message}"</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => acceptFriendRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectFriendRequest(request.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Requests */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sent Requests</h3>
                {sentRequests.length === 0 ? (
                  <p className="text-gray-600">No sent requests</p>
                ) : (
                  <div className="space-y-4">
                    {sentRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={getUserAvatar(request.receiver)}
                            alt={request.receiver.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{request.receiver.name}</h4>
                            <p className="text-sm text-gray-600">{request.receiver.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {request.status === 'pending' ? 'Pending' : request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Search Input */}
              <div className="flex space-x-4">
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  className="flex-1"
                />
                <Button onClick={searchUsers} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img
                          src={getUserAvatar(user)}
                          alt={user.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.is_friend ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Friends
                          </Badge>
                        ) : user.friend_request_status === 'sent' ? (
                          <Badge variant="secondary">Request Sent</Badge>
                        ) : user.friend_request_status === 'received' ? (
                          <Badge variant="secondary">Request Received</Badge>
                        ) : (
                          <div className="flex space-x-2">
                            <Input
                              type="text"
                              placeholder="Optional message..."
                              value={requestMessage}
                              onChange={(e) => setRequestMessage(e.target.value)}
                              className="w-40"
                            />
                            <Button
                              size="sm"
                              onClick={() => sendFriendRequest(user.id)}
                            >
                              Add Friend
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}