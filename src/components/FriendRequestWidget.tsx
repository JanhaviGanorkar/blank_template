import { useState, useEffect } from 'react';
import { useFriendStore } from '../store/friendStore';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import FriendRequests from '../components/FriendRequests';
import { 
  Users, 
  UserPlus
} from 'lucide-react';

// Simple Friend Request Widget for Dashboard
export const FriendRequestWidget = () => {
  const { requestCounts, fetchRequestCounts } = useFriendStore();
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  useEffect(() => {
    fetchRequestCounts();
    
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchRequestCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchRequestCounts]);

  if (showFriendRequests) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Friend Requests</h2>
            <Button 
              variant="ghost" 
              onClick={() => setShowFriendRequests(false)}
            >
              ✕
            </Button>
          </div>
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <FriendRequests />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Friend Requests
        </h3>
        {requestCounts.total_count > 0 && (
          <Badge variant="destructive">
            {requestCounts.total_count}
          </Badge>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Received:</span>
          <Badge variant={requestCounts.received_count > 0 ? "default" : "secondary"}>
            {requestCounts.received_count}
          </Badge>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Sent:</span>
          <Badge variant={requestCounts.sent_count > 0 ? "outline" : "secondary"}>
            {requestCounts.sent_count}
          </Badge>
        </div>
      </div>
      
      <Button 
        onClick={() => setShowFriendRequests(true)}
        className="w-full"
        variant="outline"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Manage Friends
      </Button>
    </div>
  );
};