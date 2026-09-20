# Conectar Ollama al CRM (asistente IA local)

## Objetivo

Que el CRM hable con un modelo de lenguaje que se ejecuta en tu propio ordenador mediante Ollama: un asistente al que preguntas sobre tus ofertas y que además redacta y resume por ti. Nada sale de tu equipo ni se paga por uso: el modelo corre en local.

## Qué verás en el CRM

- **Nueva pestaña "IA" en Ajustes**: dirección de Ollama (por defecto `http://localhost:11434`),选择 del modelo (se rellena solo con los modelos que tienes instalados), botón **Probar conexión** y un aviso claro cuando Ollama no esté disponible, con los pasos para arreglarlo.
- **Nueva sección "Asistente" en el menú lateral**: un chat donde escribes preguntas del tipo *"¿qué ofertas llevan más de dos semanas sin actividad?"* o *"resume la situación de la oferta X"*. Las respuestas llegan de forma progresiva (se ven mientras se escriben) y puedes detenerlas.
- **Botones en la ficha de una oferta**: **Resumir** (situación, última actividad, riesgo y siguiente paso) y **Redactar seguimiento** (texto listo para copiar a WhatsApp o email, que puedes guardar como actividad).

## Cómo funciona (y su limitación)

Ollama es un programa que corre en tu ordenador. El CRM, al estar publicado, se abre en el navegador de tu equipo, y es el navegador quien llama a Ollama directamente. Esto tiene dos consecuencias que conviene tener claras:

- Funciona **solo en el equipo donde tienes Ollama instalado**. Tus compañeros verán la misma pantalla, pero con un aviso de "IA no disponible" hasta que ellos también tengan Ollama o se conecte un modelo en la nube.
- Tu modelo necesita autorizar expresamente que la web del CRM le escriba. Se hace con una variable de entorno al arrancar Ollama; la pantalla de Ajustes te da el comando exacto ya relleno con la dirección de tu CRM.

Para que todo el equipo lo use sin instalar nada, el camino es conectar un modelo en la nube (Lovable AI). La arquitectura que voy a montar deja eso preparado: la misma pantalla y los mismos botones funcionan cambiando el proveedor, sin tocar la interfaz.

## Qué construyo

1. **Capa de conexión** (`src/lib/ai/`): un módulo que detecta si Ollama responde, lista los modelos instalados, genera el texto de forma progresiva y traduce los errores a mensajes entendibles ("Ollama no está funcionando", "el modelo no está descargado", "el navegador ha bloqueado la conexión").
2. **Ajustes → IA**: formulario de configuración guardado por usuario, prueba de conexión y guía de arranque.
3. **Asistente** (página nueva con su ruta y entrada en el menú): chat con historial, respuesta en streaming, botón de parada y limpieza. Antes de responder, el asistente recibe un resumen de tus datos (ofertas, fases, importes, últimas actividades) leído con tu propia sesión, para que las respuestas sean sobre tu CRM real.
4. **Acciones en la ficha de la oferta**: resumir y redactar seguimiento, con el resultado copiable y guardable como actividad.
5. **Fallo elegante**: si Ollama no está, los botones y el chat explican qué falta en lugar de quedarse cargando o dar un error técnico.

Nada de esto toca la base de datos ni los permisos: es solo lectura de lo que ya puedes ver, y ningún resultado se guarda salvo que tú lo guardes como actividad.

## Qué necesito de tu parte

- Tener Ollama instalado y al menos un modelo descargado. Si no lo tienes, te digo el comando de instalación y cuál descargar.
- El resto lo dejo listo yo; solo harás un copiar/pegar para autorizar la conexión y recargar el CRM.
