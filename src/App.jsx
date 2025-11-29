import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Catalogo from "./pages/Catalogo";
import Disponibilidad from "./pages/Disponibilidad";
import Venta from "./pages/Venta";
import Envios from "./pages/Envios";
import Gestion from "./pages/Gestion";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/disponibilidad" element={<Disponibilidad />} />
        <Route path="/venta" element={<Venta />} />
        <Route path="/envios" element={<Envios />} />
        <Route path="/gestion" element={<Gestion />} />
      </Routes>
    </BrowserRouter>
  );
}
