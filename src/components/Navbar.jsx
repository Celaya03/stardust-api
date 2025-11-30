import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: "1rem", backgroundColor: "#eee" }}>
      <Link to="/" style={{ marginRight: 10 }}>Home</Link>
      <Link to="/catalogo">Catálogo</Link>
    </nav>
  );
}


