# Mini site – Solicitudes a Trade Marketing (Cineplanet)

Formulario para que los gerentes de cine envíen requerimientos al área de Marketing.

**Cómo funciona:** el gerente llena el formulario → al enviarlo:
- 📧 llega un correo a **asparrow@cineplanet.com.pe** con todos los datos y la foto adjunta
- 📁 la foto se guarda en Google Drive (cuenta alonsosparrow@gmail.com) en la carpeta **Trade_MKT**
- 📊 la solicitud queda registrada en el Google Sheet **Solicitudes Trade MKT** (misma carpeta), con una columna *Estado* (Pendiente / En proceso / Atendido / Rechazado) para organizar los pedidos

Todo es gratuito: Netlify (sitio) + Google Apps Script (correo, Drive y Sheet).

```
minisite-trade-mkt/
├── index.html          ← el formulario (lo que ven los gerentes)
├── logo.png            ← logo Cineplanet
└── apps-script/
    └── Code.gs         ← código que se pega en Google Apps Script (no lo usa Netlify)
```

---

## Paso 1 · Crear el "backend" en Google (10 min, una sola vez)

1. Entra a **https://script.google.com** con la cuenta **alonsosparrow@gmail.com**.
2. Clic en **Nuevo proyecto**. Ponle de nombre `Solicitudes Trade MKT`.
3. Borra todo lo que aparece en `Código.gs` y pega el contenido de `apps-script/Code.gs`. Guarda (💾).
4. En la barra de arriba elige la función **`probar`** y pulsa **Ejecutar**.
   - Google pedirá permisos → *Revisar permisos* → elige la cuenta → *Configuración avanzada* → *Ir a Solicitudes Trade MKT (no seguro)* → *Permitir*. (Es normal: el script es tuyo.)
   - Debe llegar un correo de prueba a asparrow@cineplanet.com.pe y se crearán la carpeta `Trade_MKT` y el Sheet en tu Drive.
5. Clic en **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo (alonsosparrow@gmail.com)**
   - Quién tiene acceso: **Cualquier usuario**
   - Pulsa **Implementar** y **copia la URL** (termina en `/exec`).

## Paso 2 · Conectar el formulario

Abre `index.html`, busca esta línea (casi al final) y pega tu URL entre las comillas:

```js
const APPS_SCRIPT_URL = "PEGAR_AQUI_URL_DE_APPS_SCRIPT";
```

## Paso 3 · Subir a GitHub y publicar en Netlify

1. En GitHub crea un repositorio nuevo (ej. `solicitudes-trade-mkt`) y sube `index.html` y `logo.png`
   (*Add file → Upload files*). La carpeta `apps-script` es opcional, solo como respaldo.
2. En **https://app.netlify.com** → *Add new site → Import an existing project* → GitHub → elige el repositorio.
3. Deja la configuración vacía (no hay build) y pulsa **Deploy**.
4. Opcional: en *Site configuration → Change site name* ponle un nombre fácil, ej. `solicitudes-trade-mkt.netlify.app`.

Cada vez que edites algo en GitHub, Netlify actualiza el sitio solo.

---

## Cambios frecuentes

| Quiero cambiar… | Dónde |
|---|---|
| El correo que recibe las solicitudes | `Code.gs` → `EMAIL_DESTINO` (luego *Implementar → Gestionar implementaciones → Editar → Nueva versión*) |
| Agregar más de un destinatario | `EMAIL_DESTINO: 'correo1@cineplanet.com.pe,correo2@cineplanet.com.pe'` |
| Lista de provincias o tipos de trabajo | `index.html` → las etiquetas `<option>` |
| Tamaño máximo de la foto | `index.html` → `MAX_BYTES` y `Code.gs` → `MAX_FOTO_KB` |

> ⚠️ Si modificas `Code.gs`, siempre vuelve a publicar una **nueva versión** de la implementación; si no, el sitio seguirá usando la versión anterior.

**Límites de Google (cuenta Gmail gratuita):** ~100 correos al día, de sobra para este uso.
