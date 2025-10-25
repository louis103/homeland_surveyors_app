import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({
    roles: ['viewer'],
    canAddParcels: false,
    canEditParcels: false,
    canDeleteParcels: false,
    canAddCalendarEvents: false,
    canEditCalendarEvents: false,
    canDeleteCalendarEvents: false,
    isAdmin: false,
    isEditor: false,
    isViewer: true,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setPermissions(prev => ({ ...prev, loading: false }));
      return;
    }

    fetchPermissions();
  }, [user]);

  const fetchPermissions = async () => {
    try {
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('roles')
        .eq('user_id', user.id)
        .single();

      if (rolesError && rolesError.code !== 'PGRST116') {
        console.error('Error fetching roles:', rolesError);
      }

      // Fetch permissions
      const { data: permsData, error: permsError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (permsError && permsError.code !== 'PGRST116') {
        console.error('Error fetching permissions:', permsError);
      }

      const roles = rolesData?.roles || ['viewer'];
      const isAdmin = roles.includes('admin');
      const isEditor = roles.includes('editor');
      const isViewer = roles.includes('viewer');

      setPermissions({
        roles,
        canAddParcels: permsData?.can_add_parcels || false,
        canEditParcels: permsData?.can_edit_parcels || false,
        canDeleteParcels: permsData?.can_delete_parcels || false,
        canAddCalendarEvents: permsData?.can_add_calendar_events || false,
        canEditCalendarEvents: permsData?.can_edit_calendar_events || false,
        canDeleteCalendarEvents: permsData?.can_delete_calendar_events || false,
        isAdmin,
        isEditor,
        isViewer,
        loading: false,
      });
    } catch (error) {
      console.error('Error in fetchPermissions:', error);
      setPermissions(prev => ({ ...prev, loading: false }));
    }
  };

  const refreshPermissions = () => {
    fetchPermissions();
  };

  return { ...permissions, refreshPermissions };
};
