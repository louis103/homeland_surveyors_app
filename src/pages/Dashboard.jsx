import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Mail, X, Calendar, Plus, Search, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import ParcelCard from '../components/ParcelCard';
import { usePermissions } from '../hooks/usePermissions';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchParcels();
  }, [user]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length === 0 || searchQuery.length >= 3) {
        fetchParcels(searchQuery);
      }
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const fetchParcels = async (search = '') => {
    try {
      setLoading(true);
      let query = supabase
        .from('parcels')
        .select('*')
        .eq('user_id', user?.id);

      if (search) {
        query = query.ilike('parcel_number', `%${search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setParcels(data || []);
    } catch (error) {
      console.error('Error fetching parcels:', error);
      toast.error('Failed to load parcels');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast.error('Failed to sign out');
      } else {
        toast.success('Signed out successfully');
        navigate('/signin');
      }
    } catch (error) {
      toast.error('An error occurred while signing out');
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img src="/web-icon.png" alt="Homeland Surveyors" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-gray-900">Homeland Surveyors</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {permissions.isAdmin && (
                <button
                  onClick={() => navigate('/dashboard/permissions')}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <Shield className="h-5 w-5" />
                  <span className="hidden sm:block font-medium">Edit Permissions</span>
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard/calendar')}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Calendar className="h-5 w-5 text-gray-700" />
                <span className="hidden sm:block text-gray-700 font-medium">Calendar</span>
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="hidden sm:block text-gray-700 font-medium">
                  {user?.user_metadata?.username || 'User'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="text-center p-6 pb-4 shrink-0">
              <div className="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
            </div>

            <div className="space-y-4 overflow-y-auto px-6 pb-4 flex-1">
              {/* Username */}
              {user?.user_metadata?.username && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="shrink-0">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Username</p>
                    <p className="text-lg text-gray-900">{user.user_metadata.username}</p>
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="shrink-0">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Email Address</p>
                  <p className="text-lg text-gray-900 break-all">{user?.email}</p>
                </div>
              </div>

              {/* Email Verification Status */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="shrink-0">
                  <div className={`h-3 w-3 rounded-full ${
                    user?.email_confirmed_at ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Email Status</p>
                  <p className="text-lg text-gray-900">
                    {user?.email_confirmed_at ? 'Verified' : 'Pending Verification'}
                  </p>
                </div>
              </div>

              {/* Roles */}
              {!permissions.loading && permissions.roles && (
                <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="shrink-0">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Roles</p>
                    <div className="flex flex-wrap gap-2">
                      {permissions.roles.map((role) => (
                        <span
                          key={role}
                          className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full capitalize"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Permissions */}
              {!permissions.loading && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-medium text-gray-700">Your Permissions</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      { check: permissions.canAddParcels, label: 'Add Parcels' },
                      { check: permissions.canEditParcels, label: 'Edit Parcels' },
                      { check: permissions.canDeleteParcels, label: 'Delete Parcels' },
                      { check: permissions.canAddCalendarEvents, label: 'Add Calendar Events' },
                      { check: permissions.canEditCalendarEvents, label: 'Edit Calendar Events' },
                      { check: permissions.canDeleteCalendarEvents, label: 'Delete Calendar Events' },
                    ].map(({ check, label }) => (
                      <div key={label} className="flex items-center space-x-2">
                        {check ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={check ? 'text-gray-900' : 'text-gray-500'}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 pt-4 flex space-x-3 shrink-0 border-t border-gray-200">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  handleSignOut();
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.user_metadata?.username || 'User'}!
              </h2>
              <p className="text-gray-600">
                Manage your land parcels and metadata
              </p>
            </div>
            {permissions.canAddParcels && (
              <button
                onClick={() => navigate('/dashboard/parcel/new')}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Add Parcel</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Total Parcels</h4>
            <p className="text-3xl font-bold text-blue-600">{parcels.length}</p>
            <p className="text-sm text-gray-500 mt-1">Registered parcels</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">This Month</h4>
            <p className="text-3xl font-bold text-green-600">
              {parcels.filter(p => {
                const date = new Date(p.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Added this month</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Recent</h4>
            <p className="text-3xl font-bold text-purple-600">
              {parcels.filter(p => {
                const date = new Date(p.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date >= weekAgo;
              }).length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Added this week</p>
          </div>
        </div>

        {/* Parcels Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Land Parcels</h3>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by parcel number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : parcels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'No parcels found matching your search.' : 'No parcels found. Add your first parcel to get started.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate('/dashboard/parcel/new')}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add First Parcel</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parcels.map((parcel) => (
                <ParcelCard key={parcel.id} parcel={parcel} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
