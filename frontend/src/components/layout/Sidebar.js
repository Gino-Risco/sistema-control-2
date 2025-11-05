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
import { useContext } from "react"; // Importar useContext
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import { motion } from "framer-motion";
import { AuthContext } from "../../context/AuthContext"; // Importar AuthContext

export default function Sidebar() {
  const { userRole, logout } = useContext(AuthContext); // Obtener userRole y logout del AuthContext
  const navigate = useNavigate(); // Obtener el hook navigate

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  // Definimos aquí qué enlaces puede ver cada rol
  const navLinks = [
    { to: "/", icon: <FaHome />, label: "Dashboard", allowedRoles: ["Administrador"] },
    { to: "/trabajadores", icon: <FaUsers />, label: "Trabajadores", allowedRoles: ["Administrador"] },
    { to: "/asistencias", icon: <FaCalendarCheck />, label: "Asistencias", allowedRoles: ["Administrador", "Supervisor", "Trabajador"] },
    { to: "/areas", icon: <FaBuilding />, label: "Áreas", allowedRoles: ["Administrador"] },
    { to: "/reportes", icon: <FaChartLine />, label: "Reportes", allowedRoles: ["Administrador", "Supervisor"] },
    { to: "/usuarios", icon: <FaUsers />, label: "Usuarios", allowedRoles: ["Administrador"] },
    { to: "/configuracion", icon: <FaCogs />, label: "Configuración", allowedRoles: ["Administrador"] },
  ];

  const filteredNavLinks = navLinks.filter(link => 
    userRole && link.allowedRoles.includes(userRole)
  );

  const allUserLinks = [
    ...filteredNavLinks,
  ];

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
        {allUserLinks.map((link, index) => (
          <SidebarLink key={index} to={link.to} icon={link.icon} label={link.label} delay={(index + 1) * 0.1} />
        ))}

        <hr className="text-secondary" />

        <SidebarLink
          to="#"
          icon={<FaSignOutAlt />}
          label="Cerrar sesión"
          textColor="text-danger"
          onClick={handleLogoutClick} // Pasar el manejador de clic
          delay={0.8}
        />
      </Nav>
    </motion.div>
  );
}

function SidebarLink({ to, icon, label, textColor = "text-light", delay = 0, onClick }) { // Añadir prop onClick
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
        onClick={onClick} // Pasar onClick a Nav.Link
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
