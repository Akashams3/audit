import { useState, useEffect } from "react";
import FacultyDashboard from "./FacultyDashboard";
import HODDashboard from "./HODDashboard";
import IQACDashboard from "./IQACDashboard";

function Home() {
  const [role, setRole] = useState("");

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    setRole(savedRole);
  }, []);

  const renderContent = () => {
    if (role === "faculty") return <FacultyDashboard />;
    if (role === "hod") return <HODDashboard />;
    if (role === "iqac") return <IQACDashboard />;
    if (role === "announcement") return <h2>Announcements</h2>;
  };

  return (
    <div className="flex h-screen">

      {/* 🔹 SIDEBAR */}
      <div className="w-64 bg-blue-800 text-white p-5">
        <h2 className="text-xl font-bold mb-5">IQAC Panel</h2>

        <ul className="space-y-3">
          <li>
            <button onClick={() => setRole("faculty")} className="hover:bg-blue-600 p-2 w-full text-left rounded">
              Faculty
            </button>
          </li>

          <li>
            <button onClick={() => setRole("hod")} className="hover:bg-blue-600 p-2 w-full text-left rounded">
              HOD
            </button>
          </li>

          <li>
            <button onClick={() => setRole("iqac")} className="hover:bg-blue-600 p-2 w-full text-left rounded">
              IQAC
            </button>
          </li>

          <li>
            <button onClick={() => setRole("announcement")} className="hover:bg-blue-600 p-2 w-full text-left rounded">
              Announcements
            </button>
          </li>
        </ul>
      </div>

      {/* 🔹 MAIN CONTENT */}
      <div className="flex-1 p-6 bg-gray-100">
        {renderContent()}
      </div>
    </div>
  );
}

export default Home;
