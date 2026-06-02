import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Shield,
  Bell,
  Lock,
  Key,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    notifications: {
      email: true,
      browser: true,
      approvalAlerts: true,
      systemAlerts: true,
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationChange = (key) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // API call to update profile
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // API call to change password
      toast.success("Password changed successfully");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch {
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);

    try {
      // API call to update notification preferences
      toast.success("Notification preferences updated");
    } catch {
      toast.error("Failed to update notification preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
          Settings
        </p>
        <h3 className="text-3xl font-semibold text-[#31101e]">
          Account Settings
        </h3>
        <p className="text-sm text-[#7c4a5e]">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f5e9]">
              <User className="h-5 w-5 text-[#2c8a49]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#31101e]">
                Profile Settings
              </h2>
              <p className="text-sm text-[#7c4a5e]">
                Update your personal information
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#7c4a5e]">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c4a5e]" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] py-3 pl-12 pr-4 text-[#31101e] placeholder:text-[#a44255] outline-none transition focus:border-[#ff4d6d] focus:bg-white"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#7c4a5e]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c4a5e]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] py-3 pl-12 pr-4 text-[#31101e] placeholder:text-[#a44255] outline-none transition focus:border-[#ff4d6d] focus:bg-white"
                  placeholder="Enter your email"
                  disabled
                />
              </div>
              <p className="mt-1 text-xs text-[#a44255]">
                Email cannot be changed
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2c8a49] to-[#5ec271] px-4 py-3 font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff3e0]">
              <Lock className="h-5 w-5 text-[#d1661c]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#31101e]">
                Change Password
              </h2>
              <p className="text-sm text-[#7c4a5e]">Update your password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#7c4a5e]">
                Current Password
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c4a5e]" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] py-3 pl-12 pr-12 text-[#31101e] placeholder:text-[#a44255] outline-none transition focus:border-[#ff4d6d] focus:bg-white"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7c4a5e] hover:text-[#31101e]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#7c4a5e]">
                New Password
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c4a5e]" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] py-3 pl-12 pr-12 text-[#31101e] placeholder:text-[#a44255] outline-none transition focus:border-[#ff4d6d] focus:bg-white"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7c4a5e] hover:text-[#31101e]"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#7c4a5e]">
                Confirm New Password
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c4a5e]" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] py-3 pl-12 pr-4 text-[#31101e] placeholder:text-[#a44255] outline-none transition focus:border-[#ff4d6d] focus:bg-white"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#d1661c] to-[#f2994a] px-4 py-3 font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Notification Settings */}
        <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e3f2fd]">
              <Bell className="h-5 w-5 text-[#1e5aa8]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#31101e]">
                Notification Preferences
              </h2>
              <p className="text-sm text-[#7c4a5e]">
                Manage your notification settings
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#7c4a5e]" />
                <div>
                  <p className="font-medium text-[#31101e]">
                    Email Notifications
                  </p>
                  <p className="text-sm text-[#7c4a5e]">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange("email")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notifications.email ? "bg-[#2c8a49]" : "bg-[#ffe0e8]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notifications.email
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-[#7c4a5e]" />
                <div>
                  <p className="font-medium text-[#31101e]">
                    Browser Notifications
                  </p>
                  <p className="text-sm text-[#7c4a5e]">
                    Receive in-browser notifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange("browser")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notifications.browser
                    ? "bg-[#2c8a49]"
                    : "bg-[#ffe0e8]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notifications.browser
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-[#7c4a5e]" />
                <div>
                  <p className="font-medium text-[#31101e]">Approval Alerts</p>
                  <p className="text-sm text-[#7c4a5e]">
                    Get notified for new approval requests
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange("approvalAlerts")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notifications.approvalAlerts
                    ? "bg-[#2c8a49]"
                    : "bg-[#ffe0e8]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notifications.approvalAlerts
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-[#7c4a5e]" />
                <div>
                  <p className="font-medium text-[#31101e]">System Alerts</p>
                  <p className="text-sm text-[#7c4a5e]">
                    Get notified for system issues
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange("systemAlerts")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notifications.systemAlerts
                    ? "bg-[#2c8a49]"
                    : "bg-[#ffe0e8]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notifications.systemAlerts
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleNotificationUpdate}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1e5aa8] to-[#6fb1ff] px-4 py-3 font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff7f9]">
              <Shield className="h-5 w-5 text-[#9b1e27]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#31101e]">
                Account Information
              </h2>
              <p className="text-sm text-[#7c4a5e]">Your account details</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
              <span className="text-sm text-[#7c4a5e]">Role</span>
              <span className="font-medium text-[#31101e]">SuperAdmin</span>
            </div>
            <div className="flex justify-between rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
              <span className="text-sm text-[#7c4a5e]">Account Status</span>
              <span className="inline-flex items-center rounded-full bg-[#e8f5e9] px-3 py-1 text-sm font-semibold text-[#2c8a49]">
                Active
              </span>
            </div>
            <div className="flex justify-between rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
              <span className="text-sm text-[#7c4a5e]">Member Since</span>
              <span className="font-medium text-[#31101e]">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
