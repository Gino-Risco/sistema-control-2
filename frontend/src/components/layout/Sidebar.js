import React from "react";
import { Nav, Image } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaCalendarCheck,
  FaBuilding,
  FaChartLine,
  FaCogs,
  FaSignOutAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";

export default function Sidebar() {
  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 80 }}
      className="d-flex flex-column p-3 bg-dark text-white shadow-lg"
      style={{
        width: "250px",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        overflowY: "auto",
      }}
    >
      {/* Logo / Título */}
      <motion.div
        className="text-center mb-4"
        style={{ marginTop: "25px" }} 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Image
          src="/images/logo.png"
          roundedCircle
          width="80"
          height="80"
          alt="Logo"
          className="shadow-sm"
        />
        <h5 className="mt-3 fw-bold text-info">Control de Asistencia</h5>
      </motion.div>

      {/* Menú lateral */}
      <Nav className="flex-column">
        <SidebarLink to="/" icon={<FaHome />} label="Dashboard" delay={0.1} />
        <SidebarLink
          to="/trabajadores"
          icon={<FaUsers />}
          label="Trabajadores"
          delay={0.2}
        />
        <SidebarLink
          to="/asistencias"
          icon={<FaCalendarCheck />}
          label="Asistencias"
          delay={0.3}
        />
        <SidebarLink to="/areas" icon={<FaBuilding />} label="Áreas" delay={0.4} />
        <SidebarLink
          to="/reportes"
          icon={<FaChartLine />}
          label="Reportes"
          delay={0.5}
        />
        <SidebarLink
          to="/usuarios"
          icon={<FaUsers />}
          label="Usuarios"
          delay={0.6}
        />
        <SidebarLink
          to="/configuracion"
          icon={<FaCogs />}
          label="Configuración"
          delay={0.7}
        />
        <hr className="text-secondary" />
        <SidebarLink
          to="#"
          icon={<FaSignOutAlt />}
          label="Cerrar sesión"
          textColor="text-danger"
          delay={0.8}
        />
      </Nav>
    </motion.div>
  );
}

function SidebarLink({ to, icon, label, textColor = "text-light", delay = 0 }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, x: 5 }}
      transition={{ type: "spring", stiffness: 300 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Nav.Link
        as={NavLink}
        to={to}
        end
        className={`mb-2 d-flex align-items-center gap-3 px-3 py-2 rounded ${textColor}`}
        style={({ isActive }) => ({
          backgroundColor: isActive ? "#0d6efd" : "transparent",
          color: isActive ? "white" : "lightgray",
          fontWeight: isActive ? "bold" : "normal",
          textDecoration: "none",
          transition: "all 0.2s ease-in-out",
          boxShadow: isActive ? "0 0 10px rgba(13,110,253,0.4)" : "none",
        })}
      >
        <motion.div
          whileHover={{ rotate: 10 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {icon}
        </motion.div>
        {label}
      </Nav.Link>
    </motion.div>
  );
}
