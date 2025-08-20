import React from "react";

const Profile = ({ user }) => (
  <div className="min-h-screen p-5 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
    👤 Logged in as <strong>{user.email}</strong>
  </div>
);

export default Profile;
