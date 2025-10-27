import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Pencil, Trash2, X, Upload, Loader, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';

const ParcelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = usePermissions();
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (id !== 'new') {
      fetchParcel();
    } else {
      setLoading(false);
      setIsEditing(true);
      setFormData(getEmptyFormData());
    }
  }, [id]);

  const getEmptyFormData = () => ({
    parcel_number: '',
    owners: [{ id: '', name: '', kra: '' }],
    survey_date: '',
    survey_fees: { paid: '', pending: '0' },
    board_fees: { paid: '', pending: '0' },
    title_fees: { paid: '', pending: '0' },
    transfer_fees: { paid: '', pending: '0' },
    rim_fees: { paid: '', pending: '0' },
    stamp_duty: { paid: '', pending: '0' },
    physical_planning_fees: { paid: '', pending: '0' },
    search_fees: { paid: '', pending: '0' },
    other_services: { paid: '', pending: '0' },
    succession_fees: { paid: '', pending: '0' },
    imagesurl: [],
    dwg_files: [],
    payment_records: [],
    mutations_files: [],
    physical_planning_files: [],
    title_deed_files: [],
    lcb_files: [],
    transfer_files: [],
  });

  const fetchParcel = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parcels')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setParcel(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching parcel:', error);
      toast.error('Failed to load parcel details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `images/${id !== 'new' ? id : 'temp'}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('parcel-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('parcel-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        imagesurl: [...(prev.imagesurl || []), ...uploadedUrls]
      }));

      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload some images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      imagesurl: prev.imagesurl.filter((_, i) => i !== index)
    }));
  };

  const handleDownloadImage = async (url, index) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `parcel-${parcel?.parcel_number || id}-image-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const handleDeleteImage = async (url, index) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      // Extract file path from URL
      // URL format: https://{project}.supabase.co/storage/v1/object/public/parcel-images/images/{id}/{filename}
      const urlParts = url.split('/parcel-images/');
      if (urlParts.length < 2) {
        throw new Error('Invalid image URL format');
      }
      const filePath = urlParts[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('parcel-images')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Remove from formData
      const updatedImages = formData.imagesurl.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        imagesurl: updatedImages
      }));

      // Update database if not in edit mode
      if (!isEditing && id !== 'new') {
        const { error: dbError } = await supabase
          .from('parcels')
          .update({ imagesurl: updatedImages })
          .eq('id', id);

        if (dbError) throw dbError;
        setParcel(prev => ({ ...prev, imagesurl: updatedImages }));
      }

      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleDwgUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedFiles = [];

    try {
      for (const file of Array.from(files)) {
        const fileName = file.name.toLowerCase();
        // Check if file is DWG, Word document, or BAK file
        const isValid = fileName.endsWith('.dwg') || 
                       fileName.endsWith('.doc') || 
                       fileName.endsWith('.docx') ||
                       fileName.endsWith('.bak');
        
        if (!isValid) {
          toast.error(`${file.name} is not a valid file type (DWG, Word, or BAK)`);
          continue;
        }

        const uniqueFileName = `${Date.now()}-${file.name}`;
        const filePath = `dwg/${id !== 'new' ? id : 'temp'}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('parcel-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('parcel-images')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          url: publicUrl,
          name: file.name,
          size: file.size,
          type: fileName.endsWith('.dwg') ? 'dwg' : 
                fileName.endsWith('.bak') ? 'bak' : 'doc',
        });
      }

      setFormData(prev => ({
        ...prev,
        dwg_files: [...(prev.dwg_files || []), ...uploadedFiles]
      }));

      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload some files');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDwg = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('DWG file downloaded successfully');
    } catch (error) {
      console.error('Error downloading DWG file:', error);
      toast.error('Failed to download DWG file');
    }
  };

  const handleDeleteDwg = async (url, index) => {
    if (!confirm('Are you sure you want to delete this DWG file? This action cannot be undone.')) {
      return;
    }

    try {
      const urlParts = url.split('/parcel-images/');
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL format');
      }
      const filePath = urlParts[1];

      const { error: storageError } = await supabase.storage
        .from('parcel-images')
        .remove([filePath]);

      if (storageError) throw storageError;

      const updatedFiles = formData.dwg_files.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        dwg_files: updatedFiles
      }));

      if (!isEditing && id !== 'new') {
        const { error: dbError } = await supabase
          .from('parcels')
          .update({ dwg_files: updatedFiles })
          .eq('id', id);

        if (dbError) throw dbError;
        setParcel(prev => ({ ...prev, dwg_files: updatedFiles }));
      }

      toast.success('DWG file deleted successfully');
    } catch (error) {
      console.error('Error deleting DWG file:', error);
      toast.error('Failed to delete DWG file');
    }
  };

  const handleRemoveDwg = (index) => {
    setFormData(prev => ({
      ...prev,
      dwg_files: prev.dwg_files.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.parcel_number) {
      toast.error('Parcel number is required');
      return;
    }

    try {
      setLoading(true);

      if (id === 'new') {
        const { data, error } = await supabase
          .from('parcels')
          .insert([{ ...formData, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        toast.success('Parcel created successfully');
        navigate(`/dashboard/parcel/${data.id}`);
      } else {
        // Remove id and other system fields before update
        const { id: _, created_at, user_id, ...updateData } = formData;
        
        const { error } = await supabase
          .from('parcels')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;
        setParcel(formData);
        setIsEditing(false);
        toast.success('Parcel updated successfully');
      }
    } catch (error) {
      console.error('Error saving parcel:', error);
      toast.error('Failed to save parcel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);

      // Delete images from storage
      if (parcel.imagesurl && parcel.imagesurl.length > 0) {
        for (const url of parcel.imagesurl) {
          const path = url.split('/parcel-images/')[1];
          if (path) {
            await supabase.storage.from('parcel-images').remove([path]);
          }
        }
      }

      // Delete DWG files from storage
      if (parcel.dwg_files && parcel.dwg_files.length > 0) {
        for (const file of parcel.dwg_files) {
          const path = file.url.split('/parcel-images/')[1];
          if (path) {
            await supabase.storage.from('parcel-images').remove([path]);
          }
        }
      }

      const { error } = await supabase
        .from('parcels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Parcel deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting parcel:', error);
      toast.error('Failed to delete parcel');
      setLoading(false);
    }
  };

  const handleOwnerChange = (index, field, value) => {
    const newOwners = [...formData.owners];
    newOwners[index][field] = value;
    setFormData({ ...formData, owners: newOwners });
  };

  const addOwner = () => {
    setFormData({
      ...formData,
      owners: [...formData.owners, { id: '', name: '', kra: '' }]
    });
  };

  const removeOwner = (index) => {
    if (formData.owners.length > 1) {
      setFormData({
        ...formData,
        owners: formData.owners.filter((_, i) => i !== index)
      });
    }
  };

  const handleFeeChange = (feeType, field, value) => {
    setFormData({
      ...formData,
      [feeType]: {
        ...formData[feeType],
        [field]: value
      }
    });
  };

  // Payment Records Handlers
  const addPaymentRecord = () => {
    setFormData({
      ...formData,
      payment_records: [...(formData.payment_records || []), { name: '', amount: '0', payment_date: '' }]
    });
  };

  const removePaymentRecord = (index) => {
    setFormData({
      ...formData,
      payment_records: formData.payment_records.filter((_, i) => i !== index)
    });
  };

  const handlePaymentRecordChange = (index, field, value) => {
    const newRecords = [...(formData.payment_records || [])];
    newRecords[index][field] = value;
    setFormData({ ...formData, payment_records: newRecords });
  };

  // Generic Document Upload Handler
  const handleDocumentUpload = async (files, documentType) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedFiles = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          toast.error(`${file.name} is not a PDF file`);
          continue;
        }

        const uniqueFileName = `${Date.now()}-${file.name}`;
        const filePath = `${documentType}/${id !== 'new' ? id : 'temp'}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('parcel-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('parcel-images')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          url: publicUrl,
          name: file.name,
          size: file.size,
          uploaded_at: new Date().toISOString(),
        });
      }

      const fieldName = `${documentType}_files`;
      setFormData(prev => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] || []), ...uploadedFiles]
      }));

      toast.success(`${uploadedFiles.length} document(s) uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${documentType} documents:`, error);
      toast.error('Failed to upload some documents');
    } finally {
      setUploading(false);
    }
  };

  // Generic Document Download Handler
  const handleDocumentDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  // Generic Document Delete Handler
  const handleDocumentDelete = async (url, index, documentType) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      const urlParts = url.split('/parcel-images/');
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL format');
      }
      const filePath = urlParts[1];

      const { error: storageError } = await supabase.storage
        .from('parcel-images')
        .remove([filePath]);

      if (storageError) throw storageError;

      const fieldName = `${documentType}_files`;
      const updatedFiles = formData[fieldName].filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        [fieldName]: updatedFiles
      }));

      if (!isEditing && id !== 'new') {
        const { error: dbError } = await supabase
          .from('parcels')
          .update({ [fieldName]: updatedFiles })
          .eq('id', id);

        if (dbError) throw dbError;
        setParcel(prev => ({ ...prev, [fieldName]: updatedFiles }));
      }

      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  // Generic Document Remove from List Handler
  const handleDocumentRemove = (index, documentType) => {
    const fieldName = `${documentType}_files`;
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index)
    }));
  };

  if (loading && id !== 'new') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const feeTypes = [
    { key: 'survey_fees', label: 'Survey Fees' },
    { key: 'board_fees', label: 'Board Fees' },
    { key: 'title_fees', label: 'Title Fees' },
    { key: 'transfer_fees', label: 'Transfer Fees' },
    { key: 'rim_fees', label: 'RIM Fees' },
    { key: 'stamp_duty', label: 'Stamp Duty' },
    { key: 'physical_planning_fees', label: 'Physical Planning Fees' },
    { key: 'search_fees', label: 'Search Fees' },
    { key: 'succession_fees', label: 'Succession Fees' },
    { key: 'other_services', label: 'Other Services' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-4">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </button>
              <h1 className="text-base sm:text-2xl font-bold text-gray-900 truncate">
                {id === 'new' ? 'New Parcel' : `Parcel ${parcel?.parcel_number || ''}`}
              </h1>
            </div>
            {id !== 'new' && !isEditing && (permissions.canEditParcels || permissions.canDeleteParcels) && (
              <div className="flex space-x-2 sm:space-x-3">
                {permissions.canEditParcels && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 p-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-5 w-5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                )}
                {permissions.canDeleteParcels && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center space-x-2 p-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>
            )}
            {isEditing && (
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (id === 'new') {
                      navigate('/dashboard');
                    } else {
                      setFormData(parcel);
                      setIsEditing(false);
                    }
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* Basic Info */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parcel Number *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.parcel_number}
                    onChange={(e) => setFormData({ ...formData, parcel_number: e.target.value })}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., OTHAYA/KIHUGIRU/907"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{parcel?.parcel_number}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Survey Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.survey_date || ''}
                    onChange={(e) => setFormData({ ...formData, survey_date: e.target.value })}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                ) : (
                  <p className="text-lg text-gray-900">
                    {parcel?.survey_date ? new Date(parcel.survey_date).toLocaleDateString() : 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Owners */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Owners</h2>
              {isEditing && (
                <button
                  onClick={addOwner}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Owner
                </button>
              )}
            </div>
            {formData?.owners?.map((owner, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={owner.name}
                      onChange={(e) => handleOwnerChange(index, 'name', e.target.value)}
                      className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{owner.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={owner.id}
                      onChange={(e) => handleOwnerChange(index, 'id', e.target.value)}
                      className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{owner.id}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KRA PIN
                  </label>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={owner.kra}
                          onChange={(e) => handleOwnerChange(index, 'kra', e.target.value)}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {formData.owners.length > 1 && (
                          <button
                            onClick={() => removeOwner(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-900">{owner.kra}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Fees */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Fees & Charges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feeTypes.map(({ key, label }) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">{label}</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Paid</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData[key]?.paid || ''}
                          onChange={(e) => handleFeeChange(key, 'paid', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder="0"
                        />
                      ) : (
                        <p className="text-gray-900">{parcel?.[key]?.paid || '0'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Pending</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData[key]?.pending || '0'}
                          onChange={(e) => handleFeeChange(key, 'pending', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder="0"
                        />
                      ) : (
                        <p className="text-gray-900">{parcel?.[key]?.pending || '0'}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Records */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Payment Records</h2>
              {isEditing && (
                <button
                  onClick={addPaymentRecord}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Payment
                </button>
              )}
            </div>
            {formData?.payment_records && formData.payment_records.length > 0 ? (
              <div className="space-y-4">
                {formData.payment_records.map((record, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payer Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={record.name}
                            onChange={(e) => handlePaymentRecordChange(index, 'name', e.target.value)}
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., John Doe"
                          />
                        ) : (
                          <p className="text-gray-900">{record.name || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount (KES)
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={record.amount}
                            onChange={(e) => handlePaymentRecordChange(index, 'amount', e.target.value)}
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0"
                          />
                        ) : (
                          <p className="text-gray-900">{record.amount || '0'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Date
                        </label>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={record.payment_date}
                              onChange={(e) => handlePaymentRecordChange(index, 'payment_date', e.target.value)}
                              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {formData.payment_records.length > 1 && (
                              <button
                                onClick={() => removePaymentRecord(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-900">
                            {record.payment_date ? new Date(record.payment_date).toLocaleDateString() : 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No payment records added</p>
            )}
          </div>

          {/* Images */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Images</h2>
            {isEditing && (
              <div className="mb-4">
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="text-center">
                    {uploading ? (
                      <>
                        <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Uploading images...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload images</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory">
              {formData?.imagesurl?.map((url, index) => (
                <div key={index} className="relative group shrink-0 w-64 snap-start">
                  <img
                    src={url}
                    alt={`Parcel image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-gray-800 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Remove from list"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownloadImage(url, index)}
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                      title="Download image"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteImage(url, index)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                      title="Delete image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(!formData?.imagesurl || formData.imagesurl.length === 0) && !isEditing && (
              <p className="text-gray-500 text-center py-8">No images uploaded</p>
            )}
          </div>

          {/* DWG Files & Word Documents */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">AutoCAD DWG & Word Documents</h2>
            {isEditing && (
              <div className="mb-4">
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="text-center">
                    {uploading ? (
                      <>
                        <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Uploading files...</p>
                      </>
                    ) : (
                      <>
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload DWG, Word, or BAK files</p>
                        <p className="text-xs text-gray-500 mt-1">AutoCAD .dwg, .bak, .doc, .docx files</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".dwg,.doc,.docx,.bak"
                    onChange={(e) => handleDwgUpload(e.target.files)}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData?.dwg_files?.map((file, index) => (
                <div key={index} className="relative group p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileText className="h-10 w-10 text-blue-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        {file.size && (
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveDwg(index)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                        title="Remove from list"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleDownloadDwg(file.url, file.name)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDwg(file.url, index)}
                      className="flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(!formData?.dwg_files || formData.dwg_files.length === 0) && !isEditing && (
              <p className="text-gray-500 text-center py-8">No DWG or Word files uploaded</p>
            )}
          </div>

          {/* MUTATIONS Documents */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mutations Documents</h2>
            {isEditing && (
              <div className="mb-4">
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="text-center">
                    {uploading ? (
                      <>
                        <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload Mutations PDFs</p>
                        <p className="text-xs text-gray-500 mt-1">PDF files only</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => handleDocumentUpload(e.target.files, 'mutations')}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData?.mutations_files?.map((file, index) => (
                <div key={index} className="relative group p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileText className="h-10 w-10 text-red-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        {file.size && (
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleDocumentRemove(index, 'mutations')}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                        title="Remove from list"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleDocumentDownload(file.url, file.name)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDocumentDelete(file.url, index, 'mutations')}
                      className="flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(!formData?.mutations_files || formData.mutations_files.length === 0) && !isEditing && (
              <p className="text-gray-500 text-center py-8">No mutations documents uploaded</p>
            )}
          </div>

          {/* Physical Planning Documents */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Physical Planning Documents</h2>
            {isEditing && (
              <div className="mb-4">
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="text-center">
                    {uploading ? (
                      <>
                        <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload Physical Planning PDFs</p>
                        <p className="text-xs text-gray-500 mt-1">PDF files only</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => handleDocumentUpload(e.target.files, 'physical_planning')}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData?.physical_planning_files?.map((file, index) => (
                <div key={index} className="relative group p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-green-500 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileText className="h-10 w-10 text-green-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        {file.size && (
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleDocumentRemove(index, 'physical_planning')}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                        title="Remove from list"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleDocumentDownload(file.url, file.name)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDocumentDelete(file.url, index, 'physical_planning')}
                      className="flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(!formData?.physical_planning_files || formData.physical_planning_files.length === 0) && !isEditing && (
              <p className="text-gray-500 text-center py-8">No physical planning documents uploaded</p>
            )}
          </div>

          {/* Title Deed Documents */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Title Deed Documents</h2>
            {isEditing && (
              <div className="mb-4">
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="text-center">
                    {uploading ? (
                      <>
                        <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload Title Deed PDFs</p>
                        <p className="text-xs text-gray-500 mt-1">PDF files only</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => handleDocumentUpload(e.target.files, 'title_deed')}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData?.title_deed_files?.map((file, index) => (
                <div key={index} className="relative group p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-purple-500 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileText className="h-10 w-10 text-purple-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        {file.size && (
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleDocumentRemove(index, 'title_deed')}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                        title="Remove from list"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleDocumentDownload(file.url, file.name)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDocumentDelete(file.url, index, 'title_deed')}
                      className="flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(!formData?.title_deed_files || formData.title_deed_files.length === 0) && !isEditing && (
              <p className="text-gray-500 text-center py-8">No title deed documents uploaded</p>
            )}
          </div>

          {/* LCB Documents */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">LCB Documents</h2>
            {isEditing && (
              <div className="mb-4">
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="text-center">
                    {uploading ? (
                      <>
                        <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload LCB PDFs</p>
                        <p className="text-xs text-gray-500 mt-1">PDF files only</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => handleDocumentUpload(e.target.files, 'lcb')}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData?.lcb_files?.map((file, index) => (
                <div key={index} className="relative group p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileText className="h-10 w-10 text-orange-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        {file.size && (
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleDocumentRemove(index, 'lcb')}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                        title="Remove from list"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleDocumentDownload(file.url, file.name)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDocumentDelete(file.url, index, 'lcb')}
                      className="flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(!formData?.lcb_files || formData.lcb_files.length === 0) && !isEditing && (
              <p className="text-gray-500 text-center py-8">No LCB documents uploaded</p>
            )}
          </div>

          {/* Transfer Documents */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Transfer Documents</h2>
            {isEditing && (
              <div className="mb-4">
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="text-center">
                    {uploading ? (
                      <>
                        <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload Transfer PDFs</p>
                        <p className="text-xs text-gray-500 mt-1">PDF files only</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => handleDocumentUpload(e.target.files, 'transfer')}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData?.transfer_files?.map((file, index) => (
                <div key={index} className="relative group p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-indigo-500 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileText className="h-10 w-10 text-indigo-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        {file.size && (
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleDocumentRemove(index, 'transfer')}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                        title="Remove from list"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleDocumentDownload(file.url, file.name)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDocumentDelete(file.url, index, 'transfer')}
                      className="flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(!formData?.transfer_files || formData.transfer_files.length === 0) && !isEditing && (
              <p className="text-gray-500 text-center py-8">No transfer documents uploaded</p>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Do you want to delete the parcel with ID <strong>{parcel?.id}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParcelDetails;
