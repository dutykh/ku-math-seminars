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

// Middleware to capture raw body for signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Function to verify GitHub webhook signature
function verifySignature(payload, signature) {
  if (!SECRET) {
    console.log('WARNING: No webhook secret configured. Skipping signature verification.');
    return true;
  }
  
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
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
    const signature = req.get('X-Hub-Signature-256');
    const payload = req.body;
    
    // Verify the webhook signature
    if (!verifySignature(payload, signature)) {
      console.log('Invalid signature');
      return res.status(401).send('Unauthorized');
    }
    
    // Parse the JSON payload
    const event = JSON.parse(payload.toString());
    
    // Check if this is a push event to the main branch
    if (event.ref === 'refs/heads/main' || event.ref === 'refs/heads/master') {
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
      console.log(`Ignoring push to ${event.ref}`);
      res.status(200).send('Ignored - not main/master branch');
    }
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Webhook server is running');
});

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
});
