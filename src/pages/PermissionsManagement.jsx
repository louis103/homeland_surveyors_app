import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import { ArrowLeft, Shield, Check, X, Save, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const PermissionsManagement = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: permLoading } = usePermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (!permLoading && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
      return;
    }

    if (!permLoading && isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, permLoading, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_users_with_roles');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users. Make sure you have admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (userId, role) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const currentRoles = user.roles || ['viewer'];
        let newRoles;

        if (currentRoles.includes(role)) {
          // Remove role (but keep at least viewer)
          newRoles = currentRoles.filter(r => r !== role);
          if (newRoles.length === 0) {
            newRoles = ['viewer'];
          }
        } else {
          // Add role
          newRoles = [...currentRoles, role];
        }

        return { ...user, roles: newRoles };
      }
      return user;
    }));
  };

  const togglePermission = (userId, permission) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          [permission]: !user[permission]
        };
      }
      return user;
    }));
  };

  const saveUserPermissions = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      setSaving(userId);

      // Update roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .update({ 
          roles: user.roles,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      // Update permissions
      const { error: permsError } = await supabase
        .from('user_permissions')
        .update({
          can_add_parcels: user.can_add_parcels || false,
          can_edit_parcels: user.can_edit_parcels || false,
          can_delete_parcels: user.can_delete_parcels || false,
          can_add_calendar_events: user.can_add_calendar_events || false,
          can_edit_calendar_events: user.can_edit_calendar_events || false,
          can_delete_calendar_events: user.can_delete_calendar_events || false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (permsError) throw permsError;

      toast.success('Permissions updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Failed to update permissions');
    } finally {
      setSaving(null);
    }
  };

  if (permLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">User Access Control</h2>
            <p className="text-gray-600">Manage user roles and permissions for the system.</p>
          </div>

          <div className="space-y-6">
            {users.map((user) => (
              <div key={user.id} className="border border-gray-200 rounded-xl p-6">
                {/* User Info */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.username || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      User ID: {user.id.substring(0, 8)}...
                    </p>
                  </div>
                  <button
                    onClick={() => saveUserPermissions(user.id)}
                    disabled={saving === user.id}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {saving === user.id ? (
                      <>
                        <Loader className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
                        <span className="hidden sm:inline">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Save Changes</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Roles */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Roles</h4>
                  <div className="flex flex-wrap gap-2">
                    {['admin', 'editor', 'viewer'].map((role) => {
                      const hasRole = (user.roles || []).includes(role);
                      return (
                        <button
                          key={role}
                          onClick={() => toggleRole(user.id, role)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                            hasRole
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                              : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {hasRole ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          <span className="capitalize font-medium">{role}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Detailed Permissions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { key: 'can_add_parcels', label: 'Add Parcels' },
                      { key: 'can_edit_parcels', label: 'Edit Parcels' },
                      { key: 'can_delete_parcels', label: 'Delete Parcels' },
                      { key: 'can_add_calendar_events', label: 'Add Calendar Events' },
                      { key: 'can_edit_calendar_events', label: 'Edit Calendar Events' },
                      { key: 'can_delete_calendar_events', label: 'Delete Calendar Events' },
                    ].map(({ key, label }) => {
                      const hasPermission = user[key];
                      return (
                        <button
                          key={key}
                          onClick={() => togglePermission(user.id, key)}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                            hasPermission
                              ? 'bg-green-50 border-green-500 text-green-700'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-sm font-medium">{label}</span>
                          {hasPermission ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found in the system.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PermissionsManagement;
