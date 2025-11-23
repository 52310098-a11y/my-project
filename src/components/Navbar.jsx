import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-blue-400 p-2 flex justify-center w-screen">
      <Link to="/about">About</Link>
    </nav>
  );
}

export default Navbar;
