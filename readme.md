# 🌟 Stardust Cafetería API

API REST para el sistema de venta de productos de la cafetería Stardust.

## 🚀 Instalación
```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start
```

## 📡 Endpoints Principales

### Para otros equipos (expuestos):

**GET /api/catalogo**
Obtiene el catálogo de productos disponibles.

**POST /api/verificar-disponibilidad**
Verifica si hay stock de productos.
```json
{
  "productos": [
    { "id_producto": 1, "cantidad": 2 }
  ]
}
```

**POST /api/registrar-venta**
Registra una venta desde Gestión de Ventas.

### Endpoints internos:

- `POST /api/productos` - Crear producto
- `GET /api/pedidos` - Ver pedidos
- `GET /api/pedidos/:id` - Ver detalle de pedido
- `PATCH /api/productos/:id/stock` - Actualizar stock

## 🔧 Variables de Entorno

Configura tu archivo `.env`:
```env
PORT=3000
DATABASE_URL=postgresql://...
GV_API_URL=http://...
GE_API_URL=http://...
BCO_API_URL=http://...
```

## 📊 Base de Datos

PostgreSQL con las siguientes tablas:
- catalogo_productos
- pedido
- detalle_pedido
- cliente
- pago
- entrega
- comprobante
- incidencia

## 🌐 Despliegue en Render

1. Sube el código a GitHub
2. Conecta Render con tu repositorio
3. Crea base de datos PostgreSQL en Render
4. Configura variables de entorno
5. Ejecuta el script `seed.sql` para cargar productos

## 🤝 Integración con otros equipos

**Necesitas las URLs de:**
- Gestión de Ventas (GV)
- Gestión de Entregas (GE)
- Banco (BCO)

**Tu URL la compartes con:**
- Gestión de Ventas
- Gestión del Mall

## 📞 Equipo

Equipo: Venta de Productos Cafetería (E6)
Producto: Stardust Cafetería