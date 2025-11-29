import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: 20, background: "#222", color: "white" }}>
      <Link to="/" style={{ marginRight: 15, color: "white" }}>Catálogo</Link>
      <Link to="/disponibilidad" style={{ marginRight: 15, color: "white" }}>Disponibilidad</Link>
      <Link to="/venta" style={{ marginRight: 15, color: "white" }}>Venta</Link>
      <Link to="/envios" style={{ marginRight: 15, color: "white" }}>Envíos</Link>
      <Link to="/gestion" style={{ color: "white" }}>Gestión</Link>
    </nav>
  );
}
