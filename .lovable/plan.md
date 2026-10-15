## Diagnóstico de la invitación para gala.santiago@gmail.com (solo lectura, no se ha cambiado nada)

### 1. ¿Se puede hacer con lo que ya tiene el CRM?
Sí. Ajustes → Equipo → "Invitar compañero", con el rol **Administrador**. Nadie crea ni comparte contraseñas: la persona invitada entra con su propia cuenta (correo y contraseña suyos, o Google) y acepta en `/invite/<enlace>`.

### 2. ¿Hace falta que un administrador inicie sesión?
- Para **crear** una invitación basta con haber iniciado sesión y ser miembro del equipo. Cualquier miembro puede invitar, incluso con rol de administrador. Esto es un punto débil: un comercial podría invitar a un administrador.
- Para **ver, revocar o editar** invitaciones hay que ser quien la creó o un administrador del mismo equipo.
- Para **aceptar**, la persona invitada tiene que haber iniciado sesión con **ese mismo correo**, ya confirmado.

### 3. ¿El enlace sirve una sola vez?
Sí, en la práctica. Al aceptarlo, la invitación pasa a "aceptada" y el enlace deja de funcionar. Además caduca a los 14 días y solo vale para el correo invitado. Ojo: si alguien abre el enlace sin aceptar, puede ver el correo, el rol y el nombre del equipo. Al aceptar, la persona pierde sus roles anteriores y recibe el rol de la invitación.

### 4. ¿Cómo se envía el correo?
No se envía. La app solo crea el enlace y lo copia al portapapeles, como ya avisa la propia pantalla. Hay que mandarlo a mano, por un canal de confianza. Para que salga por correo desde la app habría que configurar un dominio de envío verificado (por ejemplo agencia1click.es) y programar ese correo. Eso hoy no existe.

### 5. Situación actual (comprobada solo leyendo, sin mostrar el enlace)
- **Ya existe una invitación pendiente** para gala.santiago@gmail.com con rol **administrador**. Se creó el 12/10/2026 y caduca el **26/10/2026**.
- **La cuenta ya existe** (creada el 26/08/2026), con el correo confirmado. Pertenece a 1 equipo (puede ser uno propio creado automáticamente), no tiene rol asignado y no tiene nombre visible ("sgala72" no está puesto).
- Dominio: este proyecto no tiene ningún dominio propio conectado; solo zen-deal-board.lovable.app. Tendrás que comprobar si crm.agencia1click.es apunta a este CRM o a otra copia. Si es otra copia, estos datos no son los suyos.

### 6. Cómo comprobarlo tú, de forma legítima
1. Un administrador del equipo inicia sesión → Ajustes → Equipo → "Invitaciones pendientes". Ahí verá la invitación y podrá copiar el enlace (icono de copiar) o revocarla.
2. Le envía el enlace a Santiago por un canal privado. Santiago inicia sesión con gala.santiago@gmail.com (si no recuerda la contraseña, usa "¿Olvidaste tu contraseña?"), abre el enlace y pulsa "Aceptar".
3. Santiago pone "sgala72" en Ajustes → Perfil.
4. Para confirmarlo: en Ajustes → Equipo → Miembros debe salir con el rol "admin", y la invitación ya no debe aparecer como pendiente.

### Mejoras posibles (no aplicadas; solo si las pides)
- Que solo los administradores puedan invitar con rol de administrador.
- Enviar el correo de invitación desde la app, cuando haya un dominio verificado.
