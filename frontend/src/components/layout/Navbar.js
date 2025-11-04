import React, { useState, useEffect } from "react";
import {
  Navbar as BootstrapNavbar,
  Container,
  Nav,
  Dropdown,
  Badge,
  Button,
} from "react-bootstrap";
import {
  FaUser,
  FaBell,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaCogs,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState("light");
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = () => {
      const user =
        JSON.parse(localStorage.getItem("currentUser")) || {
          nombre: "Administrador",
          rol: "Administrador",
          avatar: null,
        };
      setCurrentUser(user);

      const savedTheme = localStorage.getItem("theme") || "light";
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    };

    loadUserData();

    setNotifications([
      { id: 1, message: "Nuevo trabajador registrado", time: "hace 2h", read: false },
      { id: 2, message: "Reporte mensual generado", time: "hace 1 día", read: true },
      { id: 3, message: "Actualización del sistema disponible", time: "hace 3 días", read: true },
    ]);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Deseas cerrar sesión?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });

    if (result.isConfirmed) {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken");

      navigate("/login");

      Swal.fire({
        title: "¡Hasta pronto!",
        text: "Has cerrado sesión correctamente",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <BootstrapNavbar
      expand="lg"
      className="shadow-sm border-bottom bg-white"
      style={{
        position: "fixed",
        top: 0,
        left: "250px",
        right: 0,
        zIndex: 1000,
        height: "60px",
      }}
    >
      <Container fluid className="px-4">
        {/* Brand */}
        <motion.div
          className="d-flex align-items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="text-decoration-none">
            <h5 className="mb-0 fw-bold text-primary">
              <span className="text-dark">Sistema de</span> Control de Asistencia
            </h5>
          </Link>
        </motion.div>

        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center gap-3">

            {/* Tema (modo claro / oscuro) */}
            <motion.div whileHover={{ scale: 1.1 }}>
              <Button
                variant={theme === "light" ? "outline-dark" : "outline-light"}
                size="sm"
                onClick={toggleTheme}
                className="d-flex align-items-center justify-content-center border-0 shadow-sm"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  backgroundColor: theme === "light" ? "#f8f9fa" : "#212529",
                }}
              >
                {theme === "light" ? <FaMoon /> : <FaSun color="#FFD43B" />}
              </Button>
            </motion.div>

            {/* Notificaciones */}
            <Dropdown align="end">
              <Dropdown.Toggle
                as={motion.button}
                whileHover={{ scale: 1.1 }}
                className="btn btn-outline-secondary position-relative border-0 shadow-sm d-flex align-items-center justify-content-center"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <FaBell className="text-muted" />
                {unreadNotifications > 0 && (
                  <Badge
                    bg="danger"
                    className="position-absolute top-0 start-100 translate-middle rounded-circle"
                    style={{
                      fontSize: "0.65rem",
                      width: "18px",
                      height: "18px",
                      padding: "0",
                    }}
                  >
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </Badge>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu className="mt-2 shadow-lg border-0 rounded-3" style={{ minWidth: "320px" }}>
                <div className="px-3 py-2 border-bottom">
                  <h6 className="mb-0 fw-semibold">Notificaciones</h6>
                </div>

                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <Dropdown.Item
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`py-2 ${notification.read ? "text-muted" : "fw-semibold bg-light"
                          }`}
                      >
                        <div className="d-flex gap-2 align-items-start">
                          <div
                            className={`mt-1 rounded-circle ${notification.read ? "bg-secondary" : "bg-primary"
                              }`}
                            style={{
                              width: "8px",
                              height: "8px",
                              opacity: 0.5,
                            }}
                          ></div>
                          <div>
                            <div>{notification.message}</div>
                            <small className="text-muted">{notification.time}</small>
                          </div>
                        </div>
                      </Dropdown.Item>
                    ))
                  ) : (
                    <Dropdown.Item className="text-center text-muted">
                      No hay notificaciones
                    </Dropdown.Item>
                  )}
                </div>

                <div className="px-3 py-2 border-top text-center">
                  <Link
                    to="/notificaciones"
                    className="text-primary text-decoration-none small"
                  >
                    Ver todas las notificaciones
                  </Link>
                </div>
              </Dropdown.Menu>
            </Dropdown>

            {/* Perfil de usuario */}
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                id="profile-dropdown"
                className="d-flex align-items-center gap-2 px-3 py-2 shadow-sm border-0"
                style={{
                  borderRadius: "12px",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "32px",
                    height: "32px",
                    fontSize: "0.8rem",
                  }}
                >
                  {currentUser?.nombre?.charAt(0)?.toUpperCase() || "A"}
                </motion.div>
                <div className="text-start">
                  <div
                    className="fw-semibold mb-0"
                    style={{ fontSize: "0.85rem" }}
                  >
                    {currentUser?.nombre}
                  </div>
                  <div
                    className="text-muted"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {currentUser?.rol}
                  </div>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="mt-2 shadow-lg border-0 rounded-3">
                <Dropdown.Header className="pb-1">Configuración</Dropdown.Header>
                <Dropdown.Item as={Link} to="/perfil" className="d-flex align-items-center gap-2">
                  <FaUser size={14} /> Mi Perfil
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/configuracion" className="d-flex align-items-center gap-2">
                  <FaCogs size={14} /> Configuración
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={handleLogout}
                  className="d-flex align-items-center gap-2 text-danger"
                >
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}
