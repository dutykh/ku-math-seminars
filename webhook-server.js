/*
 * KU Math Seminars - GitHub deployment webhook
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 * License: GNU General Public License v3.0
 *
 * Listens for GitHub push events on main/master and runs scripts/deploy.sh.
 * Fails closed: without GITHUB_WEBHOOK_SECRET every request is rejected.
 *
 * Environment:
 *   WEBHOOK_PORT            listening port  (default 3005)
 *   WEBHOOK_HOST            bind address    (default 127.0.0.1)
 *   GITHUB_WEBHOOK_SECRET   required; shared secret configured in GitHub
 */

import express from 'express';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.WEBHOOK_PORT) || 3005;
// Bind loopback by default: GitHub should reach this through Traefik, never by
// connecting to the port directly.
const HOST = process.env.WEBHOOK_HOST || '127.0.0.1';
const SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const hasSecret = Boolean(SECRET);

app.disable('x-powered-by');

// Raw body is required to verify the signature over the exact bytes GitHub
// signed. A push payload is small; cap it so a large body cannot tie up memory.
app.use('/webhook', express.raw({ type: 'application/json', limit: '1mb' }));

// Function to verify GitHub webhook signature
function verifySignature(payload, signature) {
  if (!hasSecret) {
    return false;
  }

  if (typeof signature !== 'string' || !signature.startsWith('sha256=')) {
    return false;
  }
  
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  const received = Buffer.from(signature, 'utf8');
  const expected = Buffer.from(digest, 'utf8');

  if (received.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(received, expected);
}

// Only one deployment may run at a time; a burst of pushes must not start
// overlapping builds in the same working tree.
let deploymentInFlight = false;

// Function to run deployment script
function runDeployment() {
  return new Promise((resolve, reject) => {
    const deployScript = path.join(__dirname, 'scripts', 'deploy.sh');
    const child = spawn('bash', [deployScript], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve('Deployment completed successfully');
      } else {
        reject(new Error(`Deployment failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    if (!hasSecret) {
      console.error('Webhook rejected: GITHUB_WEBHOOK_SECRET is not configured.');
      return res.status(503).send('Webhook secret is not configured');
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).send('Expected raw JSON payload');
    }

    const signature = req.get('X-Hub-Signature-256');
    const payload = req.body;
    
    // Verify the webhook signature
    if (!verifySignature(payload, signature)) {
      console.log('Invalid signature');
      return res.status(401).send('Unauthorized');
    }
    
    // Parse the JSON payload
    const event = JSON.parse(payload.toString('utf8'));
    const eventType = req.get('X-GitHub-Event');
    
    // Check if this is a push event to the main branch
    if (eventType === 'push' && (event.ref === 'refs/heads/main' || event.ref === 'refs/heads/master')) {
      if (deploymentInFlight) {
        console.log(`Push to ${event.ref} ignored: a deployment is already running.`);
        return res.status(409).send('Deployment already in progress');
      }

      console.log(`Received push to ${event.ref}, starting deployment...`);
      deploymentInFlight = true;

      // Run deployment asynchronously
      runDeployment()
        .then((result) => {
          console.log(result);
        })
        .catch((error) => {
          console.error('Deployment error:', error);
        })
        .finally(() => {
          deploymentInFlight = false;
        });

      res.status(200).send('Deployment started');
    } else {
      console.log(`Ignoring webhook event ${eventType || 'unknown'} on ${event.ref || 'unknown ref'}`);
      res.status(200).send('Ignored - only push events on main/master trigger deployment');
    }
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).send('Webhook server is running');
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Webhook server listening on http://${HOST}:${PORT}`);
  console.log(`Health check:     http://${HOST}:${PORT}/health`);
  console.log(`Webhook endpoint: http://${HOST}:${PORT}/webhook`);
  if (!hasSecret) {
    console.warn('GITHUB_WEBHOOK_SECRET is not set; every webhook request will be rejected.');
  }
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down.`);
    server.close(() => process.exit(0));
  });
}
