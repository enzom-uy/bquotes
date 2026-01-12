# TODO


- [ ] Crear proyecto en Supabase y configurar la DB con el backend.
- [ ] Configurar los schema con Drizzle.

- [ ] Módulo `auth`.
- [ ] Implementar Google OAuth para autenticar usuarios.

- [ ] Módulo `Users` con controllers y services.
- [ ] Recibir el resto de datos del registro desde el Frontend y crear el registro del `User` y `Account` en la DB.
- [ ] Implementar JWT session token y guardar el token asociado al usuario en la DB.
- [ ] Endpoint para obtener el perfil del usuario.
- [ ] Endpoints y services para actualizar el perfil del usuario.


- [ ] Middleware/Guard para validar los tokens que llegan desde el Frontend.
- [ ] Controller y Services para generar los tokens y renovarlos.


- Cuando el usuario ingresa un libro nuevo, el backend tiene que verificar si el libro ya existe en la DB junto con el autor. Si no existe, busca el libro en la API de Openlibrary e ingresa los datos faltantes (libro y autor/es) en la DB.
- [ ] Móduilo `Authors`.
