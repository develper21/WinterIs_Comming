import { useState } from "react";
import { X, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function ApprovalModal({ isOpen, onClose, type, organization, onSubmit }) {
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!remarks.trim()) {
      alert(`Please provide ${type === "approve" ? "approval remarks" : "rejection reason"}`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(organization.organizationCode, remarks);
      setRemarks("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isApprove = type === "approve";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isApprove ? "bg-emerald-100" : "bg-red-100"
            }`}>
              {isApprove ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isApprove ? "Approve Organization" : "Reject Organization"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {/* Organization Info */}
          <div className="mb-4 rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">{organization?.name}</p>
            <p className="text-xs text-gray-500">{organization?.organizationCode}</p>
          </div>

          {/* Warning */}
          {isApprove ? (
            <div className="mb-4 flex items-start gap-3 rounded-lg bg-emerald-50 p-4">
              <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-900">
                  Approving this organization will:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-emerald-800">
                  <li>• Create admin user account</li>
                  <li>• Set status to APPROVED</li>
                  <li>• Allow organization to login</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="mb-4 flex items-start gap-3 rounded-lg bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Rejecting this organization will:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-red-800">
                  <li>• Set status to REJECTED</li>
                  <li>• Organization will not be able to login</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
            </div>
          )}

          {/* Remarks Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {isApprove ? "Approval Remarks" : "Rejection Reason"}
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={isApprove ? "Enter approval remarks..." : "Enter rejection reason..."}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {isApprove ? "Optional remarks for approval record" : "Required: Provide reason for rejection"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 font-medium text-white transition ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {loading ? "Processing..." : isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
