import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: "1rem", backgroundColor: "#eee" }}>
      <Link to="/" style={{ marginRight: 10 }}>Home</Link>
      <Link to="/Disponibilidad">Disponibilidad</Link>
      <Link to="/Envios">Envios</Link>
      <Link to="/Gestion">Gestion</Link>
      <Link to="/Venta">Venta</Link>
    </nav>
  );
}



