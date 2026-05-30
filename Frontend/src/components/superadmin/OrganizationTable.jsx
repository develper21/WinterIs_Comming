import { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  return sortConfig.direction === "asc" ? <ArrowUp className="h-4 w-4 text-gray-600" /> : <ArrowDown className="h-4 w-4 text-gray-600" />;
};

export default function OrganizationTable({ 
  organizations, 
  onViewDetails, 
  onApprove, 
  onReject, 
  onSuspend,
  loading = false 
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedRows, setSelectedRows] = useState(new Set());

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleRowSelect = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === organizations.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(organizations.map(org => org._id)));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Pending
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            Suspended
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      hospital: "bg-blue-100 text-blue-800",
      bloodbank: "bg-red-100 text-red-800",
      ngo: "bg-green-100 text-green-800"
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[type] || "bg-gray-100 text-gray-800"}`}>
        {type?.toUpperCase() || "N/A"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-500">No organizations found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedRows.size === organizations.length}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </th>
            <th className="px-6 py-3 text-left">
              <button
                onClick={() => handleSort("name")}
                className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                Organization
                <SortIcon column="name" />
              </button>
            </th>
            <th className="px-6 py-3 text-left">
              <button
                onClick={() => handleSort("type")}
                className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                Type
                <SortIcon column="type" />
              </button>
            </th>
            <th className="px-6 py-3 text-left">
              <button
                onClick={() => handleSort("status")}
                className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                Status
                <SortIcon column="status" />
              </button>
            </th>
            <th className="px-6 py-3 text-left">
              <button
                onClick={() => handleSort("location")}
                className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                Location
                <SortIcon column="location" />
              </button>
            </th>
            <th className="px-6 py-3 text-left">
              <button
                onClick={() => handleSort("createdAt")}
                className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                Created
                <SortIcon column="createdAt" />
              </button>
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {organizations.map((org) => (
            <tr key={org._id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedRows.has(org._id)}
                  onChange={() => handleRowSelect(org._id)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-500">{org.organizationCode}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">{getTypeBadge(org.type)}</td>
              <td className="px-6 py-4">{getStatusBadge(org.status)}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {org.location?.city}, {org.location?.state}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(org.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onViewDetails(org)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {org.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => onApprove(org.organizationCode)}
                        className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onReject(org.organizationCode)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {org.status === "APPROVED" && (
                    <button
                      onClick={() => onSuspend(org.organizationCode)}
                      className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                      title="Suspend"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
