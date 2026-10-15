/**
 * Backend del mini site "Solicitudes a Trade Marketing" – Cineplanet
 * Se instala en Google Apps Script con la cuenta alonsosparrow@gmail.com
 *
 * Qué hace con cada solicitud:
 *  1. Guarda la foto (si hay) en la carpeta de Google Drive "Trade_MKT"
 *  2. Registra la solicitud en el Google Sheet "Solicitudes Trade MKT" (dentro de la misma carpeta)
 *  3. Envía un correo con todos los datos y la foto adjunta a EMAIL_DESTINO
 */

const CONFIG = {
  EMAIL_DESTINO: 'asparrow@cineplanet.com.pe',
  CARPETA_DRIVE: 'Trade_MKT',
  NOMBRE_HOJA:   'Solicitudes Trade MKT',
  MAX_FOTO_KB:   500,
  ZONA_HORARIA:  'America/Lima'
};

const CAMPOS = ['solicitante', 'provincia', 'complejo', 'fecha', 'tipo', 'urgencia', 'comentarios'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);

    // Validación básica
    CAMPOS.forEach(function (c) {
      if (!d[c] || String(d[c]).trim() === '') throw new Error('Falta el campo: ' + c);
      d[c] = String(d[c]).slice(0, 3000).replace(/^([=+\-@])/, "'$1"); // evita fórmulas en el Sheet
    });

    const ahora = new Date();
    const id = 'TM-' + Utilities.formatDate(ahora, CONFIG.ZONA_HORARIA, 'yyMMdd-HHmmss');
    const carpeta = obtenerCarpeta_();

    // 1. Foto a Drive
    let fotoBlob = null, fotoUrl = '';
    if (d.foto && d.foto.data) {
      const bytes = Utilities.base64Decode(d.foto.data);
      if (bytes.length > CONFIG.MAX_FOTO_KB * 1024) throw new Error('La foto supera ' + CONFIG.MAX_FOTO_KB + ' KB');
      const nombre = id + ' - ' + limpiar_(d.complejo) + '.jpg';
      fotoBlob = Utilities.newBlob(bytes, 'image/jpeg', nombre);
      fotoUrl = carpeta.createFile(fotoBlob).getUrl();
    }

    // 2. Registro en Google Sheet
    const hoja = obtenerHoja_(carpeta);
    hoja.appendRow([
      id,
      Utilities.formatDate(ahora, CONFIG.ZONA_HORARIA, 'dd/MM/yyyy HH:mm'),
      d.solicitante, d.provincia, d.complejo, d.fecha, d.tipo, d.urgencia, d.comentarios,
      fotoUrl, 'Pendiente'
    ]);

    // 3. Correo
    const filas = [
      ['N° de pedido', id],
      ['Solicitante', d.solicitante],
      ['Provincia', d.provincia],
      ['Complejo', d.complejo],
      ['Fecha de solicitud', d.fecha],
      ['Tipo de trabajo', d.tipo],
      ['Urgencia', d.urgencia],
      ['Comentarios', d.comentarios],
      ['Foto', fotoUrl ? '<a href="' + fotoUrl + '">Ver en Google Drive</a>' : 'Sin foto']
    ];
    const html =
      '<div style="font-family:Arial,sans-serif;max-width:600px">' +
      '<div style="background:#041E42;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0">' +
      '<b style="font-size:18px">Nueva solicitud a Trade Marketing</b></div>' +
      '<table style="width:100%;border-collapse:collapse;border:1px solid #D5DBE5">' +
      filas.map(function (f) {
        const valor = f[0] === 'Foto' ? f[1] : esc_(f[1]).replace(/\n/g, '<br>');
        return '<tr><td style="padding:10px;border-bottom:1px solid #D5DBE5;background:#F3F5F9;font-weight:bold;width:170px;color:#041E42">' +
               f[0] + '</td><td style="padding:10px;border-bottom:1px solid #D5DBE5">' + valor + '</td></tr>';
      }).join('') +
      '</table></div>';

    MailApp.sendEmail({
      to: CONFIG.EMAIL_DESTINO,
      subject: '[' + d.urgencia.toUpperCase() + '] Solicitud ' + id + ' – ' + d.complejo + ' – ' + d.tipo,
      htmlBody: html,
      attachments: fotoBlob ? [fotoBlob] : [],
      name: 'Solicitudes Trade MKT'
    });

    return json_({ ok: true, id: id });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

// Permite comprobar en el navegador que la URL funciona
function doGet() {
  return json_({ ok: true, mensaje: 'Backend de Solicitudes Trade MKT activo' });
}

/** Ejecuta esta función UNA VEZ desde el editor para dar permisos y probar todo. */
function probar() {
  const r = doPost({ postData: { contents: JSON.stringify({
    solicitante: 'Prueba', provincia: 'Lima', complejo: 'Complejo de prueba',
    fecha: Utilities.formatDate(new Date(), CONFIG.ZONA_HORARIA, 'yyyy-MM-dd'),
    tipo: 'Otro', urgencia: 'Baja', comentarios: 'Esto es una prueba del formulario.'
  }) } });
  Logger.log(r.getContent());
}

// ---------- utilidades ----------
function obtenerCarpeta_() {
  const it = DriveApp.getFoldersByName(CONFIG.CARPETA_DRIVE);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CONFIG.CARPETA_DRIVE);
}

function obtenerHoja_(carpeta) {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SHEET_ID');
  let ss = null;
  if (ssId) { try { ss = SpreadsheetApp.openById(ssId); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(CONFIG.NOMBRE_HOJA);
    DriveApp.getFileById(ss.getId()).moveTo(carpeta);
    const sh = ss.getSheets()[0];
    sh.setName('Solicitudes');
    sh.appendRow(['N° pedido', 'Recibido', 'Solicitante', 'Provincia', 'Complejo', 'Fecha solicitud',
                  'Tipo de trabajo', 'Urgencia', 'Comentarios', 'Foto (Drive)', 'Estado']);
    sh.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#041E42').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    // Lista desplegable para el estado del pedido
    sh.getRange('K2:K').setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(['Pendiente', 'En proceso', 'Atendido', 'Rechazado'], true).build());
    props.setProperty('SHEET_ID', ss.getId());
  }
  return ss.getSheetByName('Solicitudes') || ss.getSheets()[0];
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function limpiar_(s) {
  return String(s).replace(/[\\/:*?"<>|]/g, '').slice(0, 60);
}
