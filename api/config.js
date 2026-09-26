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
  if (req.method === 'GET') {
    try {
      const { config, sha } = await githubRead();
      return res.status(200).json({ config, sha });
    } catch (e) {
      return res.status(500).json({ error: 'No se pudo leer la configuración desde GitHub. ' + e.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const body = req.body || {};
      const newConfig = body.config || {};
      const sha = body.sha || null;

      let existing = {};
      let existingSha = sha;
      try {
        const readResult = await githubRead();
        existing = readResult.config || {};
        existingSha = readResult.sha || null;
      } catch (e) {
        // El archivo no existe todavía, se creará nuevo
      }

      const mergedConfig = { ...existing, ...newConfig };

      const result = await githubWrite(mergedConfig, existingSha || sha);
      return res.status(200).json({ config: result.config, sha: result.sha, message: 'Configuración actualizada' });
    } catch (e) {
      return res.status(500).json({ error: 'No se pudo guardar la configuración. ' + e.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
