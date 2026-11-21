import React from "react";
import { Search, Bell, UserCircle } from "lucide-react";

function Header({ activePage }) {
  return (
    <header className="header">
      <div>
        <h2>{activePage}</h2>
        <p>Welcome back, Doctor! Manage your hospital activities.</p>
      </div>

      <div className="header-right">
        <div className="header-search">
          <Search size={18} />
          <input type="text" placeholder="Search..." />
        </div>

        <button className="notification-button">
          <Bell size={21} />
          <span></span>
        </button>

        <div className="doctor-profile">
          <UserCircle size={38} />
          <div>
            <h4>Dr. Admin</h4>
            <p>Doctor</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;