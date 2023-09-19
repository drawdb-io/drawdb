import React from "react";

export default function ControlPanel() {
  return (
    <nav className="bg-gray-200 ">
      <div className="flex justify-between items-center">
        <ul className="flex justify-start text-md ms-3">
          <li className="me-5">File</li>
          <li className="me-5">Edit</li>
          <li className="me-5">Insert</li>
          <li className="me-5">View</li>
          <li className="me-5">Help</li>
        </ul>
        <button>
          <i className="fa-solid fa-caret-up me-3"></i>
        </button>
      </div>
      <div className="p-1">
        tools
      </div>
    </nav>
  );
}
