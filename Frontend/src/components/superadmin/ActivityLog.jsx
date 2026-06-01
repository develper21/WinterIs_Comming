import { useState } from "react";
import { Clock, User, ChevronDown, ChevronRight, CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";

export default function ActivityLog({ activity }) {
  const [expanded, setExpanded] = useState(false);

  const getActionIcon = () => {
    switch (activity.action?.toLowerCase()) {
      case "approve":
      case "approved":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "reject":
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "suspend":
      case "suspended":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "login":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = () => {
    switch (activity.action?.toLowerCase()) {
      case "approve":
      case "approved":
        return "bg-emerald-100 text-emerald-800";
      case "reject":
      case "rejected":
        return "bg-red-100 text-red-800";
      case "suspend":
      case "suspended":
        return "bg-amber-100 text-amber-800";
      case "login":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getActionColor()}`}>
          {getActionIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-gray-900">
                {activity.action || "Unknown Action"}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {activity.description || activity.message || "No description available"}
              </p>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          {/* User Info */}
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <User className="h-4 w-4" />
            <span>{activity.user?.name || activity.userName || "Unknown User"}</span>
            {activity.user?.email && (
              <span className="text-gray-400">({activity.user.email})</span>
            )}
          </div>

          {/* Timestamp */}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{formatTimestamp(activity.createdAt || activity.timestamp)}</span>
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Activity Details</p>
              <div className="space-y-2 text-sm">
                {activity.entity && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entity:</span>
                    <span className="font-medium text-gray-900">{activity.entity}</span>
                  </div>
                )}
                {activity.entityId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entity ID:</span>
                    <span className="font-mono text-xs text-gray-900">{activity.entityId}</span>
                  </div>
                )}
                {activity.ipAddress && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">IP Address:</span>
                    <span className="font-mono text-xs text-gray-900">{activity.ipAddress}</span>
                  </div>
                )}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div>
                    <p className="text-gray-600 mb-1">Metadata:</p>
                    <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 text-xs">
                      {JSON.stringify(activity.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
