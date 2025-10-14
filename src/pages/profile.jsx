import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Factory,
  Users,
  Briefcase,
  Calendar,
  Save,
  X,
  Edit,
  Loader2,
} from "lucide-react";
import Toast from "../components/Toast.jsx";

const InfoRow = ({
  icon: Icon,
  label,
  value,
  editable = false,
  onChange,
  placeholder,
}) => (
  <div className="flex items-start space-x-4 py-3">
    <Icon className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {editable ? (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 block w-full text-base text-gray-900 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
      ) : (
        <p className="text-base text-gray-800 font-medium break-words">
          {value || <span className="text-gray-400">Not specified</span>}
        </p>
      )}
    </div>
  </div>
);

const Profile = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [notification, setNotification] = useState(null);

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      setProfile(data || { id: user.id });
    } catch (error) {
      setNotification({ type: "error", message: "Could not load profile." });
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    setNotification(null);
    try {
      const { email, ...profileDataToSave } = profile;
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ ...profileDataToSave, id: user.id })
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      setEditing(false);
      setNotification({
        type: "success",
        message: "Profile saved successfully!",
      });
    } catch (error) {
      setNotification({ type: "error", message: "Failed to save profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    getProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-200 gap-4">
          <h1 className="text-xl font-bold text-gray-800">Company Profile</h1>
          <div className="flex space-x-3">
            {editing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition disabled:opacity-50"
                >
                  <X size={18} /> Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50 disabled:bg-green-400"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}{" "}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                <Edit size={18} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="mb-10 p-6 bg-white rounded-xl shadow-sm flex items-center space-x-6">
          <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
            <Users className="h-12 w-12 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {profile?.ceramic_name || "Your Company Name"}
            </h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Company Information
            </h3>
            <div className="divide-y divide-slate-200">
              <InfoRow
                icon={Building2}
                label="Company Name"
                value={profile.ceramic_name}
                editable={editing}
                onChange={handleChange("ceramic_name")}
                placeholder="e.g., Majestic Tiles"
              />
              <InfoRow
                icon={Users}
                label="Owner Name"
                value={profile.owner_name}
                editable={editing}
                onChange={handleChange("owner_name")}
                placeholder="e.g., John Doe"
              />
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow
                icon={Phone}
                label="Contact Number"
                value={profile.contact_number}
                editable={editing}
                onChange={handleChange("contact_number")}
                placeholder="e.g., +91 98765 43210"
              />
              <InfoRow
                icon={MapPin}
                label="Address"
                value={profile.address}
                editable={editing}
                onChange={handleChange("address")}
                placeholder="e.g., 123 Tile Street, Morbi"
              />
              <InfoRow
                icon={Briefcase}
                label="GST Number"
                value={profile.gst_number}
                editable={editing}
                onChange={handleChange("gst_number")}
                placeholder="e.g., 24ABCDE1234F1Z5"
              />
              <InfoRow
                icon={Building2}
                label="Company Type"
                value={profile.company_type}
                editable={editing}
                onChange={handleChange("company_type")}
                placeholder="e.g., Private Limited"
              />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Factory Details
            </h3>
            <div className="divide-y divide-slate-200">
              <InfoRow
                icon={Calendar}
                label="Establishment Year"
                value={profile.establishment_year}
                editable={editing}
                onChange={handleChange("establishment_year")}
                placeholder="e.g., 2010"
              />
              <InfoRow
                icon={Users}
                label="Number of Employees"
                value={profile.employee_count}
                editable={editing}
                onChange={handleChange("employee_count")}
                placeholder="e.g., 150"
              />
              <InfoRow
                icon={Factory}
                label="Factory Area (sq. ft)"
                value={profile.factory_area}
                editable={editing}
                onChange={handleChange("factory_area")}
                placeholder="e.g., 50000"
              />
              <InfoRow
                icon={Factory}
                label="Production Capacity (per day)"
                value={profile.production_capacity}
                editable={editing}
                onChange={handleChange("production_capacity")}
                placeholder="e.g., 10000 Boxes"
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Account Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900">
                {profile.updated_at
                  ? new Date(profile.updated_at).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Account Status
              </p>
              <p className="text-lg font-semibold text-green-600">Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
