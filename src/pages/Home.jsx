import React from "react";

export default function Home() {
  return (
    <div className="home">
      <header className="hero">
        <div className="hero-content">
          <h1>Bienvenido a Café Estrella</h1>
          <p>
            Donde cada taza cuenta una historia — café artesanal, postres recién hechos
            y un ambiente acogedor.
          </p>
          <a href="#menu" className="btn">Ver nuestro menú</a>
        </div>
      </header>

      <section id="about" className="about">
        <h2>Sobre Nosotros</h2>
        <p>
          En Café Estrella combinamos tradición y sabor. Nuestro café es 100 % de grano selecto,
          tostado localmente, con especialidades que van desde lattes cremosos hasta cold brew intenso.
        </p>
      </section>

      <section id="gallery" className="gallery">
        <h2>Nuestros Deliciosos Sabores</h2>
        <div className="grid">
          {/* Puedes reemplazar con imágenes reales */}
          <div className="card"><img src="/imagenes/latte.jpg" alt="Latte art" /></div>
          <div className="card"><img src="/imagenes/postre.jpg" alt="Postre casero" /></div>
          <div className="card"><img src="/imagenes/interior.jpg" alt="Interior cafetería" /></div>
          <div className="card"><img src="/imagenes/aroma.jpg" alt="Granos de café" /></div>
        </div>
      </section>

      <section id="hours" className="hours">
        <h2>Horario & Ubicación</h2>
        <p>Lunes a Domingo: 8:00 AM – 10:00 PM</p>
        <p>Dirección: Calle Falsa 123, Ciudad, País</p>
      </section>

      <footer className="footer">
        <p>© 2025 Café Estrella — Todos los derechos reservados</p>
      </footer>
    </div>
  );
}
