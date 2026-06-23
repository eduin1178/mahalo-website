# Plantilla de mensaje post-checkout (WhatsApp)

Mensaje que se envía automáticamente al cliente al finalizar el checkout.

## Objetivo

1. **Confirmar** que su registro se completó con éxito.
2. **Anticipar** que un asesor de Mahalo lo contactará pronto.
3. **Abrir la ventana de 24 horas** mediante botones de respuesta rápida, para
   habilitar conversación libre (free-form) con el equipo.

## Notas de implementación (WhatsApp Cloud API)

- Categoría de plantilla sugerida: **UTILITY** (confirmación transaccional).
- Variables: `{{1}}` = nombre del cliente · `{{2}}` = dirección o ZIP de servicio
  · `{{3}}` = horario agendado (p. ej. "hoy 23 de junio, 3:00 – 5:00 PM").
- Botones tipo **Quick Reply** (máx. 3, hasta 25 caracteres cada uno). Al ser
  tocados, abren la ventana de 24 h y devuelven un *payload* para enrutar al
  cliente en el flujo correcto.
- Sin saltos de línea ni formato dentro de los botones (restricción de WhatsApp).
- El idioma se selecciona por `language` del template (`es` / `en_US`); el
  contenido de fondo es el mismo, adaptado a cada audiencia.

---

## 🇲🇽 Español (audiencia latinoamericana)

**Header (texto):**
✅ ¡Tu registro con Mahalo está listo!

**Body:**
Hola {{1}}, gracias por elegir a Mahalo para tu internet. 🎉

Tu servicio en {{2}} quedó registrado correctamente.

📅 Te contactaremos en el horario que elegiste: *{{3}}*. Un asesor te escribirá por este mismo chat para confirmar los detalles y coordinar la instalación. No tienes que hacer nada más por ahora.

Para que podamos atenderte sin demoras, elige una opción 👇

**Footer:**
Mahalo · Estamos para ayudarte

**Botones (Quick Reply):**
1. `Confirmar mis datos`
2. `Tengo una pregunta`
3. `Prefiero que me llamen`

---

## 🇺🇸 English (North American audience)

**Header (text):**
✅ You're all set with Mahalo!

**Body:**
Hi {{1}}, thanks for choosing Mahalo for your internet. 🎉

Your service at {{2}} is confirmed.

📅 We'll reach out at the time you picked: *{{3}}*. A specialist will message you right here to go over the details and set up your installation. There's nothing else you need to do for now.

So we can help you faster, just pick an option below 👇

**Footer:**
Mahalo · Here to help

**Buttons (Quick Reply):**
1. `Confirm my details`
2. `I have a question`
3. `Call me instead`

---

## Mapeo de payloads (sugerido)

| Botón ES | Button EN | Payload | Acción en el flujo |
| -------- | --------- | ------- | ------------------ |
| Confirmar mis datos | Confirm my details | `confirm_details` | Marca lead como confirmado; pasa a coordinar instalación. |
| Tengo una pregunta | I have a question | `ask_question` | Enruta a asesor / FAQ interactiva. |
| Prefiero que me llamen | Call me instead | `request_call` | Crea tarea de llamada saliente para el equipo. |
