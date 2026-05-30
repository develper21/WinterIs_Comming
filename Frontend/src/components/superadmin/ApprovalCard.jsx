import { useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Clock
} from "lucide-react";

export default function ApprovalCard({ organization, onApprove, onReject, onViewDetails }) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(organization.organizationCode);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(organization.organizationCode);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case "hospital":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "bloodbank":
        return "bg-red-100 text-red-800 border-red-200";
      case "ngo":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = () => {
    return <Building2 className="h-4 w-4" />;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${getTypeColor(organization.type)}`}>
            {getTypeIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{organization.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(organization.type)}`}>
                {organization.type.toUpperCase()}
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                <Clock className="mr-1 h-3 w-3" />
                PENDING
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onViewDetails(organization)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <Eye className="h-5 w-5" />
        </button>
      </div>

      {/* Organization Code */}
      <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2">
        <p className="text-xs text-gray-500">Organization Code</p>
        <p className="font-mono text-sm font-semibold text-gray-900">{organization.organizationCode}</p>
      </div>

      {/* Contact Information */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="truncate">{organization.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="h-4 w-4 text-gray-400" />
          <span>{organization.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span>{organization.location?.city}, {organization.location?.state}</span>
        </div>
      </div>

      {/* License Number */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <FileText className="h-4 w-4 text-gray-400" />
        <div>
          <p className="text-xs text-gray-500">License Number</p>
          <p className="text-sm font-medium text-gray-900">{organization.licenseNumber}</p>
        </div>
      </div>

      {/* Admin Information */}
      <div className="mb-4 rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-medium text-gray-500 mb-2">Admin Details</p>
        <div className="space-y-1">
          <p className="text-sm text-gray-900">
            <span className="font-medium">Name:</span> {organization.admin?.name || organization.adminName}
          </p>
          <p className="text-sm text-gray-900">
            <span className="font-medium">Email:</span> {organization.admin?.email || organization.adminEmail}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle className="h-4 w-4" />
          {loading ? "Processing..." : "Approve"}
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <XCircle className="h-4 w-4" />
          {loading ? "Processing..." : "Reject"}
        </button>
      </div>
    </div>
  );
}
