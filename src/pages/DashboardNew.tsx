import { useState, useEffect } from 'react';
import { authService } from '../api/apiclient';
import { useFriendStore } from '../store/friendStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import FriendRequests from '../components/FriendRequests';
import { 
  MessageCircle, 
  Users, 
  UserPlus, 
  Bell,
  Settings,
  LogOut
} from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'friends' | 'chat'>('dashboard');
  const { requestCounts, fetchRequestCounts } = useFriendStore();

  useEffect(() => {
    // Get user data
    const userData = authService.getStoredUserData();
    if (userData) {
      setUser(userData);
    }

    // Fetch friend request counts
    fetchRequestCounts();
  }, [fetchRequestCounts]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      window.location.href = '/login';
    }
  };

  if (activeView === 'friends') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">ChatApp</h1>
                <nav className="flex space-x-1">
                  <Button
                    variant={activeView === 'dashboard' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('dashboard')}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant={activeView === 'friends' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('friends')}
                    className="relative"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Friends
                    {requestCounts.total_count > 0 && (
                      <Badge className="ml-1 px-1 py-0 text-xs">
                        {requestCounts.total_count}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant={activeView === 'chat' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('chat')}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Chat
                  </Button>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Friends View */}
        <FriendRequests />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">ChatApp</h1>
              <nav className="flex space-x-1">
                <Button
                  variant={activeView === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('dashboard')}
                >
                  Dashboard
                </Button>
                <Button
                  variant={activeView === 'friends' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('friends')}
                  className="relative"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Friends
                  {requestCounts.total_count > 0 && (
                    <Badge className="ml-1 px-1 py-0 text-xs">
                      {requestCounts.total_count}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={activeView === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('chat')}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Chat
                </Button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Welcome Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Welcome Back!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Hello {user?.name}, ready to connect with friends?
                </p>
                <Button 
                  onClick={() => setActiveView('friends')}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Manage Friends
                </Button>
              </CardContent>
            </Card>

            {/* Friend Requests Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Friend Requests
                  {requestCounts.total_count > 0 && (
                    <Badge variant="destructive">
                      {requestCounts.total_count}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Received:</span>
                    <Badge variant={requestCounts.received_count > 0 ? "default" : "secondary"}>
                      {requestCounts.received_count}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sent:</span>
                    <Badge variant={requestCounts.sent_count > 0 ? "outline" : "secondary"}>
                      {requestCounts.sent_count}
                    </Badge>
                  </div>
                </div>
                <Button 
                  onClick={() => setActiveView('friends')}
                  className="w-full mt-4"
                  variant="outline"
                >
                  View All Requests
                </Button>
              </CardContent>
            </Card>

            {/* Chat Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Start chatting with your friends securely.
                </p>
                <Button 
                  onClick={() => setActiveView('chat')}
                  className="w-full"
                  variant="outline"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Open Chat
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setActiveView('friends')}
                    variant="outline" 
                    className="flex flex-col h-20 gap-2"
                  >
                    <UserPlus className="w-6 h-6" />
                    <span className="text-xs">Add Friends</span>
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveView('chat')}
                    variant="outline" 
                    className="flex flex-col h-20 gap-2"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-xs">Start Chat</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col h-20 gap-2"
                    disabled
                  >
                    <Bell className="w-6 h-6" />
                    <span className="text-xs">Notifications</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col h-20 gap-2"
                    disabled
                  >
                    <Settings className="w-6 h-6" />
                    <span className="text-xs">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}