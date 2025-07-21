// login.js
const BACKEND_API_BASE_URL = 'https://a5927ed9faa0.ngrok-free.app'; // <--- ¡ACTUALIZA ESTA URL!

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginMessageDiv = document.getElementById('loginMessage');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evitar el envío por defecto del formulario

        loginMessageDiv.classList.add('hidden'); // Ocultar mensajes anteriores
        loginMessageDiv.classList.remove('text-green-500', 'text-red-400'); // Limpiar estilos

        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value.trim();

        if (!username || !password) {
            loginMessageDiv.textContent = 'Por favor, ingresa tu nombre de usuario y contraseña.';
            loginMessageDiv.classList.remove('hidden');
            loginMessageDiv.classList.add('text-red-400');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Suponemos que el backend devuelve un objeto con un 'token'
                if (data.token) {
                    localStorage.setItem('token', data.token); // Almacenar el JWT
                    localStorage.setItem('username', username); // Opcional: almacenar el nombre de usuario
                    loginMessageDiv.textContent = 'Inicio de sesión exitoso. Redirigiendo...';
                    loginMessageDiv.classList.remove('hidden');
                    loginMessageDiv.classList.add('text-green-500');
                    console.log('JWT almacenado:', data.token);
                    
                    // Redirigir a la página principal o a la que se desee después del login
                    setTimeout(() => {
                        window.location.href = 'index.html'; // O 'series.html'
                    }, 1500);
                } else {
                    throw new Error('No se recibió token de autenticación.');
                }
            } else {
                loginMessageDiv.textContent = data.message || 'Error en el inicio de sesión. Credenciales inválidas.';
                loginMessageDiv.classList.remove('hidden');
                loginMessageDiv.classList.add('text-red-400');
            }
        } catch (error) {
            console.error('Error durante el inicio de sesión:', error);
            loginMessageDiv.textContent = 'Error de conexión. Asegúrate de que el servidor esté funcionando.';
            loginMessageDiv.classList.remove('hidden');
            loginMessageDiv.classList.add('text-red-400');
        }
    });
});