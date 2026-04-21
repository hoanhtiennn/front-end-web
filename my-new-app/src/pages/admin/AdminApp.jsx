import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminVerifications from "./AdminVerifications";
import AdminPosts from "./AdminPosts";
import AdminPlans from "./AdminPlans";
import AdminAmenities from "./AdminAmenities";
import AdminPostStats from "./AdminPostStats";

export default function AdminApp({ onExit }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <AdminUsers />;
      case "verifications":
        return <AdminVerifications />;
      case "posts":
        return <AdminPosts />;
      case "plans":
        return <AdminPlans />;
      case "amenities":
        return <AdminAmenities />;
      case "stats":
        return <AdminPostStats />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab} onExit={onExit}>
      {renderContent()}
    </AdminLayout>
  );
}
