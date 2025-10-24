import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ParcelCard = ({ parcel }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 relative min-h-[120px] flex flex-col">
      <div className="flex-1 mb-12 sm:mb-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {parcel.parcel_number}
        </h3>
        <p className="text-sm text-gray-500">
          {parcel.owners && parcel.owners.length > 0
            ? `${parcel.owners.length} owner(s)`
            : 'No owners'}
        </p>
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
