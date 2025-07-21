require('dotenv').config(); // Carga las variables de entorno

const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Función para testear la conexión
async function testDbConnection() {
    try {
        const client = await pool.connect();
        console.log('Conectado a PostgreSQL con éxito!');
        client.release(); // Libera el cliente de vuelta al pool
    } catch (err) {
        console.error('Error al conectar a PostgreSQL:', err.message);
    }
}

// Exporta el pool para usarlo en otras partes de tu aplicación
module.exports = {
    query: (text, params) => pool.query(text, params),
    testDbConnection // Exporta la función de prueba
};