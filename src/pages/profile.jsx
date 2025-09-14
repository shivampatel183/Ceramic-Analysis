import React, { useState, useEffect } from "react";
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
} from "lucide-react";

const ProfileSection = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      {children}
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value, editable = false, onChange }) => (
  <div className="flex items-center space-x-4 py-2">
    <Icon className="w-5 h-5 text-indigo-600" />
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {editable ? (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      ) : (
        <p className="text-base text-gray-900">{value || "Not specified"}</p>
      )}
    </div>
  </div>
);

const Profile = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    ceramic_name: "",
    owner_name: "",
    contact_number: "",
    address: "",
    establishment_year: "",
    employee_count: "",
    factory_area: "",
    production_capacity: "",
    gst_number: "",
    company_type: "",
  });

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error loading profile:", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", user.id);

      if (error) throw error;
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (field) => (value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
        <button
          onClick={() => {
            if (editing) {
              updateProfile();
            } else {
              setEditing(true);
            }
          }}
          className={`px-4 py-2 rounded-lg font-medium ${
            editing
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {editing ? "Save Changes" : "Edit Profile"}
        </button>
      </div>

      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-8">
          <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
            <Users className="h-16 w-16 text-gray-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {profile.ceramic_name || "Your Company Name"}
            </h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Information */}
        <ProfileSection title="Company Information">
          <InfoRow
            icon={Building2}
            label="Company Name"
            value={profile.ceramic_name}
            editable={editing}
            onChange={handleChange("ceramic_name")}
          />
          <InfoRow
            icon={Users}
            label="Owner Name"
            value={profile.owner_name}
            editable={editing}
            onChange={handleChange("owner_name")}
          />
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <InfoRow
            icon={Phone}
            label="Contact Number"
            value={profile.contact_number}
            editable={editing}
            onChange={handleChange("contact_number")}
          />
          <InfoRow
            icon={MapPin}
            label="Address"
            value={profile.address}
            editable={editing}
            onChange={handleChange("address")}
          />
          <InfoRow
            icon={Briefcase}
            label="GST Number"
            value={profile.gst_number}
            editable={editing}
            onChange={handleChange("gst_number")}
          />
          <InfoRow
            icon={Building2}
            label="Company Type"
            value={profile.company_type}
            editable={editing}
            onChange={handleChange("company_type")}
          />
        </ProfileSection>

        {/* Factory Details */}
        <ProfileSection title="Factory Details">
          <InfoRow
            icon={Calendar}
            label="Establishment Year"
            value={profile.establishment_year}
            editable={editing}
            onChange={handleChange("establishment_year")}
          />
          <InfoRow
            icon={Users}
            label="Number of Employees"
            value={profile.employee_count}
            editable={editing}
            onChange={handleChange("employee_count")}
          />
          <InfoRow
            icon={Factory}
            label="Factory Area (sq. ft)"
            value={profile.factory_area}
            editable={editing}
            onChange={handleChange("factory_area")}
          />
          <InfoRow
            icon={Factory}
            label="Production Capacity (per day)"
            value={profile.production_capacity}
            editable={editing}
            onChange={handleChange("production_capacity")}
          />
        </ProfileSection>
      </div>

      {/* Account Stats */}
      <ProfileSection title="Account Statistics">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Member Since</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Last Updated</p>
            <p className="text-lg font-semibold text-gray-900">
              {profile.updated_at
                ? new Date(profile.updated_at).toLocaleDateString()
                : "Never"}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Account Status</p>
            <p className="text-lg font-semibold text-gray-900">Active</p>
          </div>
        </div>
      </ProfileSection>
    </div>
  );
};

export default Profile;
