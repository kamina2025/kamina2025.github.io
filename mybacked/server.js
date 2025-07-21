// backend-server/server.js (Versión modificada para NO usar email)

require('dotenv').config(); // Carga las variables de entorno

const express = require('express');
const cors = require('cors');
const db = require('./db'); // Importa la configuración de la base de datos
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000; // El puerto donde correrá tu backend
const JWT_SECRET = process.env.JWT_SECRET; // Asegúrate de tener esta línea para usar el secreto

if (!JWT_SECRET) {
    console.error('Error: JWT_SECRET no está definido en el archivo .env');
    process.exit(1);
}

// Configuración CORS - MUY IMPORTANTE para tu frontend en GitHub Pages
const corsOptions = {
    origin: '*', // Solo para desarrollo/test con ngrok, cambiar para producción
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware para parsear JSON en el cuerpo de las solicitudes
app.use(express.json());

// --- Autenticación ---
app.post('/api/auth/register', async (req, res) => {
    // ¡Aquí solo desestructuramos username y password!
    const { username, password } = req.body;

    // Validaciones básicas de entrada (añadidas para mayor robustez)
    if (!username || !password) {
        return res.status(400).json({ message: 'Nombre de usuario y contraseña son requeridos.' });
    }
    if (username.length < 3) {
        return res.status(400).json({ message: 'El nombre de usuario debe tener al menos 3 caracteres.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Insertamos solo username y password_hash (y credit_balance inicial si lo tienes)
        // Eliminamos 'email' de la sentencia INSERT
        const result = await db.query(
            'INSERT INTO users (username, password_hash, credit_balance) VALUES ($1, $2, $3) RETURNING id, username, credit_balance',
            [username, hashedPassword, 100] // Asumiendo 100 créditos iniciales
        );
        res.status(201).json({ message: 'Usuario registrado con éxito', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Código de error para unique_violation (usuario ya existe)
            res.status(400).json({ message: 'El nombre de usuario ya existe.' });
        } else {
            res.status(500).json({ message: 'Error al registrar usuario.' });
        }
    }
});

app.post('/api/auth/login', async (req, res) => {
    // ¡Aquí solo desestructuramos username y password!
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Nombre de usuario y contraseña son requeridos.' });
    }

    try {
        // Consultamos por username, no por email
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username }, // El payload del token
            JWT_SECRET, // Usamos la variable JWT_SECRET definida al inicio
            { expiresIn: '1h' } // Token expira en 1 hora
        );
        res.json({ message: 'Inicio de sesión exitoso', token, user: { id: user.id, username: user.username, credit_balance: user.credit_balance } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al iniciar sesión.' });
    }
});

// Middleware de autenticación (protege rutas que requieren login)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // No token

    // Usa JWT_SECRET aquí también
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT verification error:", err.message);
            return res.sendStatus(403); // Token inválido o expirado
        }
        req.user = user; // Guarda la información del usuario del token (userId, username)
        next();
    });
};

// --- Rutas de Créditos (Protegidas) ---
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        // La consulta de perfil también debe quitar 'email' si no lo quieres
        const result = await db.query('SELECT id, username, credit_balance FROM users WHERE id = $1', [req.user.userId]);
        if (!result.rows[0]) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener perfil del usuario.' });
    }
});

// Ruta para obtener todos los contenidos a los que el usuario tiene acceso
app.get('/api/user/content-access', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await db.query(
            'SELECT content_id, content_type FROM user_content_access WHERE user_id = $1',
            [userId]
        );
        // Devuelve un array de objetos { content_id, content_type }
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener acceso a contenido del usuario:', err);
        res.status(500).json({ message: 'Error interno del servidor al obtener acceso al contenido.' });
    }
});
// (Las rutas /api/credits/earn y /api/credits/spend no necesitan cambios,
// ya que no usan email, solo userId del token)

app.post('/api/credits/earn', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const creditsToEarn = 10; // Fijo según tu lógica

    try {
        await db.query('BEGIN');
        const userUpdateResult = await db.query(
            'UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2 RETURNING credit_balance',
            [creditsToEarn, userId]
        );
        const newBalance = userUpdateResult.rows[0].credit_balance;
        await db.query(
            'INSERT INTO credit_transactions (user_id, transaction_type, amount, description) VALUES ($1, $2, $3, $4)',
            [userId, 'GANANCIA_ANUNCIO', creditsToEarn, 'Ganancia por ver 3 anuncios']
        );
        await db.query('COMMIT');
        res.json({ message: 'Créditos añadidos con éxito', newBalance });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error al añadir créditos:', err);
        res.status(500).json({ message: 'Error interno del servidor al añadir créditos.' });
    }
});

app.post('/api/credits/spend', authenticateToken, async (req, res) => {
    const { contentId, contentType } = req.body;
    const userId = req.user.userId;

    let cost;
    if (contentType === 'chapter') {
        const costResult = await db.query('SELECT credit_cost FROM content_costs WHERE content_id = $1', [contentId]);
        if (costResult.rows.length === 0) {
            return res.status(404).json({ message: `Costo para contentId ${contentId} no encontrado.` });
        }
        cost = costResult.rows[0].credit_cost;
    } else if (contentType === 'movie') {
        cost = 2; // Ejemplo fijo para películas, si lo estás usando
    } else {
        return res.status(400).json({ message: 'Tipo de contenido inválido.' });
    }

    try {
        await db.query('BEGIN');

        // *** LÓGICA AGREGADA: Verificar si el usuario ya tiene acceso ***
        const hasAccessResult = await db.query(
            'SELECT * FROM user_content_access WHERE user_id = $1 AND content_id = $2',
            [userId, contentId]
        );

        if (hasAccessResult.rows.length > 0) {
            await db.query('ROLLBACK'); // No deduzcas créditos si ya tiene acceso
            // Opcional: Para devolver el balance actual, si quieres que el frontend lo sepa
            const currentBalance = (await db.query('SELECT credit_balance FROM users WHERE id = $1', [userId])).rows[0].credit_balance;
            return res.status(200).json({ message: 'Ya tienes acceso a este contenido.', newBalance: currentBalance });
        }
        // *** FIN LÓGICA AGREGADA ***

        const userResult = await db.query('SELECT credit_balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
        const currentBalance = userResult.rows[0].credit_balance;

        if (currentBalance < cost) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Créditos insuficientes.' });
        }

        const userUpdateResult = await db.query(
            'UPDATE users SET credit_balance = credit_balance - $1 WHERE id = $2 RETURNING credit_balance',
            [cost, userId]
        );
        const newBalance = userUpdateResult.rows[0].credit_balance;

        await db.query(
            'INSERT INTO credit_transactions (user_id, transaction_type, amount, description) VALUES ($1, $2, $3, $4)',
            [userId, `SPEND_${contentType.toUpperCase()}`, -cost, `Desbloqueo de ${contentType} ${contentId}`]
        );

        // *** LÓGICA AGREGADA: Insertar el registro de acceso ***
        await db.query(
            'INSERT INTO user_content_access (user_id, content_id, content_type) VALUES ($1, $2, $3)',
            [userId, contentId, contentType]
        );
        // *** FIN LÓGICA AGREGADA ***

        await db.query('COMMIT');
        res.json({ message: 'Contenido desbloqueado con éxito', newBalance });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error al gastar créditos:', err);
        res.status(500).json({ message: 'Error interno del servidor al gastar créditos.' });
    }
});


// Ruta para inicializar costos de contenido (¡Importante ejecutar esto una vez!)
// Protege esta ruta en producción si la mantienes.
app.post('/api/content/init-costs', authenticateToken, async (req, res) => {
    const { chapters } = req.body; // Esperamos un array de objetos {id: '...', credit_cost: N}

    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
        return res.status(400).json({ message: 'Se requiere un array de capítulos con id y credit_cost.' });
    }

    try {
        await db.query('BEGIN'); // Inicia una transacción para multiples inserciones
        for (const chapter of chapters) {
            await db.query(
                'INSERT INTO content_costs (content_id, credit_cost) VALUES ($1, $2) ON CONFLICT (content_id) DO UPDATE SET credit_cost = EXCLUDED.credit_cost',
                [chapter.id, chapter.credit_cost]
            );
        }
        await db.query('COMMIT'); // Confirma la transacción
        res.status(200).json({ message: `Costos de ${chapters.length} contenidos inicializados/actualizados.` });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error al inicializar costos de contenido:', error);
        res.status(500).json({ message: 'Error interno del servidor al inicializar costos.' });
    }
});


// --- Inicialización del servidor ---
app.listen(port, () => {
    console.log(`Backend de créditos corriendo en http://localhost:${port}`);
    db.testDbConnection(); // Prueba la conexión a la BD al iniciar el servidor
});