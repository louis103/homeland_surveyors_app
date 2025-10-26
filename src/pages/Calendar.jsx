import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Plus, Search, Trash2, X, Shield, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';

const Calendar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = usePermissions();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
  });

  useEffect(() => {
    // Only fetch when user and permissions are ready
    if (user && !permissions.loading) {
      fetchActivities();
    }
  }, [user, permissions.loading, permissions.isAdmin]);

  const fetchActivities = async () => {
    try {
      // Don't fetch if permissions not loaded yet
      if (permissions.loading) {
        return;
      }
      
      setLoading(true);
      let query = supabase
        .from('activities')
        .select('*')
        .order('date', { ascending: true });
      
      // Admin sees all activities, others see only their own
      if (!permissions.isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch creator usernames for admin view
      const activitiesWithCreators = await enrichActivitiesWithCreators(data || []);
      setActivities(activitiesWithCreators);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const enrichActivitiesWithCreators = async (activities) => {
    if (!permissions.isAdmin || activities.length === 0) {
      return activities;
    }

    try {
      // Fetch user metadata
      const { data: usersData, error } = await supabase
        .rpc('get_users_with_roles');

      if (error) throw error;

      // Create a map of user_id to username
      const userMap = {};
      usersData.forEach(u => {
        userMap[u.id] = u.username || u.email?.split('@')[0] || 'Unknown User';
      });

      // Add creator info to activities
      return activities.map(activity => ({
        ...activity,
        creator_name: userMap[activity.user_id] || 'Unknown User',
        is_own: activity.user_id === user?.id
      }));
    } catch (error) {
      console.error('Error enriching activities with creators:', error);
      return activities;
    }
  };

  const handleAddActivity = async () => {
    if (!formData.title || !formData.date) {
      toast.error('Please fill in title and date');
      return;
    }

    try {
      const { error } = await supabase
        .from('activities')
        .insert([{
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          date: formData.date,
        }]);

      if (error) throw error;

      toast.success('Activity added successfully');
      setShowAddModal(false);
      setFormData({ title: '', description: '', date: '' });
      fetchActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('Failed to add activity');
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Activity deleted successfully');
      fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    }
  };

  const getUpcomingActivities = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activities.filter(activity => new Date(activity.date) >= today);
  };

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const upcomingActivities = getUpcomingActivities();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Calendar</h1>
              </div>
            </div>
            {permissions.canAddCalendarEvents && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Add Activity</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Permission Banner */}
        {!permissions.canAddCalendarEvents && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Limited Access</p>
                <p className="text-sm text-yellow-700 mt-1">
                  You do not have enough permissions to add events. Contact your administrator to request access.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Upcoming Activities */}
        {upcomingActivities.length > 0 && (
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Activities</h2>
              {permissions.canAddCalendarEvents && activities.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {permissions.isAdmin ? 'All upcoming events in the system' : 'Events added by you'}
                </p>
              )}
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory">
              {upcomingActivities.map(activity => (
                <div key={activity.id} className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 shrink-0 w-72 snap-start text-white">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold">{activity.title}</h3>
                    {permissions.canDeleteCalendarEvents && (
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {activity.description && (
                    <p className="text-blue-100 text-sm mb-3 line-clamp-2">{activity.description}</p>
                  )}
                  <p className="text-sm font-medium">
                    {new Date(activity.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  {activity.creator_name && (
                    <div className="flex items-center gap-1 mt-2">
                      <User className="h-3 w-3" />
                      <p className="text-xs text-blue-100">
                        Created by: <span className={activity.is_own ? 'font-semibold' : ''}>{activity.creator_name}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* All Activities */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Activities</h2>
            {permissions.canAddCalendarEvents && activities.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {permissions.isAdmin ? 'All events in the system' : 'Events added by you'}
              </p>
            )}
          </div>
          <div className="divide-y divide-gray-200">
            {filteredActivities.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No activities found' : 'No activities yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try a different search term' : 'Get started by adding your first activity'}
                </p>
                {!searchQuery && permissions.canAddCalendarEvents && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Activity</span>
                  </button>
                )}
              </div>
            ) : (
              filteredActivities.map(activity => (
                <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{activity.title}</h3>
                      {activity.description && (
                        <p className="text-gray-600 text-sm mb-2">{activity.description}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {activity.creator_name && (
                        <div className="flex items-center gap-1 mt-2">
                          <User className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            Created by: <span className={activity.is_own ? 'text-blue-600 font-medium' : 'text-gray-600'}>{activity.creator_name}</span>
                          </p>
                        </div>
                      )}
                    </div>
                    {permissions.canDeleteCalendarEvents && (
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Activity</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Survey at Kihugiru"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  rows="3"
                  placeholder="Additional details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddActivity}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
