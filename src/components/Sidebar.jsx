import React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  Pill,
  LogOut,
  Stethoscope
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Appointments", icon: CalendarDays },
  { name: "Patients", icon: Users },
  { name: "Medical Records", icon: FileText },
  { name: "Prescriptions", icon: Pill }
];

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Stethoscope size={27} />
        </div>
        <div>
          <h2>MedCare</h2>
          <p>Doctor Portal</p>
        </div>
      </div>

      <div className="sidebar-menu">
        <p className="menu-heading">MAIN MENU</p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className={`menu-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      <button className="sidebar-logout">
        <LogOut size={19} />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;