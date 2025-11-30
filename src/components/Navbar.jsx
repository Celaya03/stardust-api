import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav>
      <div className="nav-links">
        <Link to="/" style={{ marginRight: 0 }}>Home</Link>
        <Link to="/Catalogo">Catalogo</Link>
        <Link to="/Disponibilidad">Disponibilidad</Link>
        <Link to="/Envios">Envios</Link>
        <Link to="/Gestion">Gestion</Link>
        <Link to="/Venta">Venta</Link>
      </div>
    </nav>
  );
}





