import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function MainLayout() {
  return (
    <div className="d-flex">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Contenedor principal */}
      <div
        className="flex-grow-1 bg-light"
        style={{
          marginLeft: "250px", 
          minHeight: "100vh",
        }}
      >
        {/* Navbar fijo arriba */}
        <Navbar />

        {/* Contenido principal debajo del navbar */}
        <main style={{ paddingTop: "80px", padding: "65px" }}>
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}
