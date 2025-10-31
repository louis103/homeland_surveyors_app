import { Eye, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ParcelCard = ({ parcel }) => {
  const navigate = useNavigate();

  // Calculate total count of owners + transferees
  const getTotalPeople = () => {
    if (!parcel.owners) return 0;
    
    // Check if it's the new structure (object with owners and transferees arrays)
    if (parcel.owners.owners || parcel.owners.transferees) {
      const ownersCount = parcel.owners.owners?.length || 0;
      const transfereeCount = parcel.owners.transferees?.length || 0;
      return ownersCount + transfereeCount;
    }
    
    // Old structure (single owner object) - from previous migration
    if (parcel.owners.owner || parcel.owners.transferees) {
      const ownerCount = parcel.owners.owner?.name ? 1 : 0;
      const transfereeCount = parcel.owners.transferees?.length || 0;
      return ownerCount + transfereeCount;
    }
    
    // Very old structure (array)
    if (Array.isArray(parcel.owners)) {
      return parcel.owners.length;
    }
    
    return 0;
  };

  const totalPeople = getTotalPeople();

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 relative min-h-[120px] flex flex-col">
      <div className="flex-1 mb-12 sm:mb-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {parcel.parcel_number}
        </h3>
        <p className="text-sm text-gray-500">
          {totalPeople > 0
            ? `${totalPeople} ${totalPeople === 1 ? 'person' : 'people'} (owners & transferees)`
            : 'No owners assigned'}
        </p>
        {parcel.creator_name && (
          <div className="flex items-center gap-1 mt-2">
            <User className="h-3 w-3 text-gray-400" />
            <p className="text-xs text-gray-500">
              Created by: <span className={parcel.is_own ? 'text-blue-600 font-medium' : 'text-gray-600'}>{parcel.creator_name}</span>
            </p>
          </div>
        )}
      </div>
      <button
        onClick={() => navigate(`/dashboard/parcel/${parcel.id}`)}
        className="absolute bottom-4 right-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Eye className="h-4 w-4" />
        <span>View</span>
      </button>
    </div>
  );
};

export default ParcelCard;
