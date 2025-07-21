// register.js
const BACKEND_API_BASE_URL = 'https://15c65c07dad2.ngrok-free.app'; // <--- ¡ACTUALIZA ESTA URL!

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerUsernameInput = document.getElementById('registerUsername');
    const registerPasswordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const registerMessageDiv = document.getElementById('registerMessage');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evitar el envío por defecto del formulario

        registerMessageDiv.classList.add('hidden'); // Ocultar mensajes anteriores
        registerMessageDiv.classList.remove('text-green-500', 'text-red-400'); // Limpiar estilos

        const username = registerUsernameInput.value.trim();
        const password = registerPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (password !== confirmPassword) {
            registerMessageDiv.textContent = 'Las contraseñas no coinciden.';
            registerMessageDiv.classList.remove('hidden');
            registerMessageDiv.classList.add('text-red-400');
            return;
        }

        if (username.length < 3) {
            registerMessageDiv.textContent = 'El nombre de usuario debe tener al menos 3 caracteres.';
            registerMessageDiv.classList.remove('hidden');
            registerMessageDiv.classList.add('text-red-400');
            return;
        }

        if (password.length < 6) {
            registerMessageDiv.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            registerMessageDiv.classList.remove('hidden');
            registerMessageDiv.classList.add('text-red-400');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                registerMessageDiv.textContent = data.message || 'Registro exitoso. ¡Ahora puedes iniciar sesión!';
                registerMessageDiv.classList.remove('hidden');
                registerMessageDiv.classList.add('text-green-500'); // Mensaje de éxito
                // Opcional: limpiar el formulario
                registerForm.reset(); 
                // Redirigir al login después de un breve retraso
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                registerMessageDiv.textContent = data.message || 'Error en el registro. Intenta de nuevo.';
                registerMessageDiv.classList.remove('hidden');
                registerMessageDiv.classList.add('text-red-400'); // Mensaje de error
            }
        } catch (error) {
            console.error('Error durante el registro:', error);
            registerMessageDiv.textContent = 'Error de conexión. Asegúrate de que el servidor esté funcionando.';
            registerMessageDiv.classList.remove('hidden');
            registerMessageDiv.classList.add('text-red-400');
        }
    });
});