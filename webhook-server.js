import express from 'express';
import crypto from 'crypto';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3005;
const SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const hasSecret = Boolean(SECRET);

// Middleware to capture raw body for signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

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
      console.log(`Received push to ${event.ref}, starting deployment...`);
      
      // Run deployment asynchronously
      runDeployment()
        .then((result) => {
          console.log(result);
        })
        .catch((error) => {
          console.error('Deployment error:', error);
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

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
});
