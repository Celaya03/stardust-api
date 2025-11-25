
/* ============================
   CATALOGO DE PRODUCTOS
   ============================ */
app.get('/api/catalogo', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT 
        id_catalogo,
        nombre,
        descripcion,
        precio,
        stock,
        imagen_url,
        categoria
      FROM catalogo_productos
      ORDER BY id_catalogo;
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error('Error al obtener catálogo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
