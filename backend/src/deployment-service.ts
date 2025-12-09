import Fastify from 'fastify';
import { spawn, ChildProcess } from 'child_process';

const fastify = Fastify({
  logger: {
    level: 'info',
  }
});

// Get indexer type from command line arguments only
const INDEXER_TYPE = process.argv[2] || 'dapp';
const INDEXER_NAME = INDEXER_TYPE === 'dapp' ? 'MEDIALANO-DAPP' : 'MEDIALANO-MIPP';
const PORT = Number(process.env.PORT) || 3000;

let indexerProcess: ChildProcess | null = null;
let indexerStats = {
  status: 'initializing',
  startTime: new Date().toISOString(),
  restarts: 0,
  lastRestart: null as string | null,
  lastError: null as string | null,
  pid: null as number | null
};

// Health check route
fastify.get('/', async (request, reply) => {
  return {
    service: `${INDEXER_NAME}-deployment-service`,
    status: indexerStats.status,
    uptime: Math.floor(process.uptime()),
    indexer: {
      name: INDEXER_NAME,
      type: INDEXER_TYPE,
      pid: indexerStats.pid,
      status: indexerStats.status,
      restarts: indexerStats.restarts,
      startTime: indexerStats.startTime,
      lastRestart: indexerStats.lastRestart,
      lastError: indexerStats.lastError
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'production',
      contractAddress: process.env.CONTRACT_ADDRESS,
      startingBlock: process.env.STARTING_BLOCK,
      streamUrl: process.env.STREAM_URL,
      preset: 'sepolia'
    },
    timestamp: new Date().toISOString()
  };
});

// Detailed status route
fastify.get('/status', async (request, reply) => {
  return {
    ...indexerStats,
    uptime: Math.floor(process.uptime()),
    memoryUsage: process.memoryUsage(),
    environment: process.env,
    config: {
      indexerName: INDEXER_NAME,
      indexerType: INDEXER_TYPE,
      port: PORT
    }
  };
});

// Health check for load balancers
fastify.get('/health', async (request, reply) => {
  if (indexerStats.status === 'running' || indexerStats.status === 'starting') {
    reply.code(200);
    return { status: 'healthy', indexer: indexerStats.status };
  } else {
    reply.code(503);
    return { status: 'unhealthy', indexer: indexerStats.status, error: indexerStats.lastError };
  }
});

// Restart endpoint (useful for debugging)
fastify.post('/restart', async (request, reply) => {
  fastify.log.info('Manual restart requested');
  restartIndexer();
  return { message: 'Indexer restart initiated', timestamp: new Date().toISOString() };
});

// Logs endpoint (last 100 lines)
fastify.get('/logs', async (request, reply) => {
  // This would require implementing log storage, for now just return basic info
  return {
    message: 'Logs endpoint - implement log storage if needed',
    indexer: INDEXER_NAME,
    status: indexerStats.status,
    lastRestart: indexerStats.lastRestart
  };
});

// Start the indexer process
const startIndexer = async () => {
  try {
    fastify.log.info(`Starting ${INDEXER_NAME} indexer...`);
    indexerStats.status = 'starting';
    indexerStats.lastError = null;

    // Build indexer first
    fastify.log.info('Building indexer...');
    const buildProcess = spawn('pnpm', ['run', 'build:indexer'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: process.env
    });

    buildProcess.on('close', (buildCode) => {
      if (buildCode === 0) {
        fastify.log.info('Build successful, starting indexer process...');
        
        // Start the actual indexer using the exact npm script
        indexerProcess = spawn('pnpm', [
          'run', 
          `start:indexer:${INDEXER_TYPE}`
        ], {
          stdio: ['inherit', 'pipe', 'pipe'],
          env: process.env
        });

        indexerStats.status = 'running';
        indexerStats.pid = indexerProcess.pid || null;
        
        fastify.log.info(`Indexer started with PID: ${indexerStats.pid}`);

        // Handle indexer process events
        indexerProcess.on('close', (code, signal) => {
          fastify.log.warn(`Indexer process exited with code ${code}, signal: ${signal}`);
          indexerStats.status = 'stopped';
          indexerStats.pid = null;
          
          // Auto-restart if process crashed (not manual shutdown)
          if (code !== 0 && code !== null && signal !== 'SIGTERM') {
            fastify.log.error(`Indexer crashed with code ${code}, restarting in 5 seconds...`);
            indexerStats.restarts++;
            indexerStats.lastRestart = new Date().toISOString();
            indexerStats.lastError = `Process exited with code ${code}`;
            
            setTimeout(() => startIndexer(), 5000);
          }
        });

        indexerProcess.on('error', (err) => {
          fastify.log.error(`Indexer process error: ${err.message}`);
          indexerStats.status = 'error';
          indexerStats.lastError = err.message;
          indexerStats.restarts++;
          indexerStats.lastRestart = new Date().toISOString();
          
          // Retry after error
          setTimeout(() => startIndexer(), 5000);
        });

        // Log indexer output
        if (indexerProcess.stdout) {
          indexerProcess.stdout.on('data', (data) => {
            fastify.log.info(`[INDEXER] ${data.toString().trim()}`);
          });
        }

        if (indexerProcess.stderr) {
          indexerProcess.stderr.on('data', (data) => {
            fastify.log.error(`[INDEXER ERROR] ${data.toString().trim()}`);
          });
        }

      } else {
        fastify.log.error(`Build failed with code ${buildCode}, retrying in 10 seconds...`);
        indexerStats.status = 'build_failed';
        indexerStats.lastError = `Build failed with code ${buildCode}`;
        setTimeout(() => startIndexer(), 10000);
      }
    });

    buildProcess.on('error', (err) => {
      fastify.log.error(`Build process error: ${err.message}`);
      indexerStats.status = 'build_error';
      indexerStats.lastError = `Build error: ${err.message}`;
      setTimeout(() => startIndexer(), 10000);
    });

  } catch (error) {
    fastify.log.error(`Error starting indexer: ${error}`);
    indexerStats.status = 'error';
    indexerStats.lastError = error instanceof Error ? error.message : String(error);
    setTimeout(() => startIndexer(), 10000);
  }
};

// Restart indexer function
const restartIndexer = () => {
  if (indexerProcess) {
    fastify.log.info('Stopping current indexer process...');
    indexerStats.status = 'restarting';
    indexerProcess.kill('SIGTERM');
    indexerProcess = null;
  }
  
  setTimeout(() => startIndexer(), 2000);
};

// Graceful shutdown handler
const gracefulShutdown = () => {
  fastify.log.info('Shutting down gracefully...');
  indexerStats.status = 'shutting_down';
  
  if (indexerProcess) {
    fastify.log.info('Terminating indexer process...');
    indexerProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds if it doesn't exit gracefully
    setTimeout(() => {
      if (indexerProcess && !indexerProcess.killed) {
        fastify.log.warn('Force killing indexer process...');
        indexerProcess.kill('SIGKILL');
      }
    }, 5000);
  }

  // Close Fastify server
  fastify.close(() => {
    fastify.log.info('Health service shutdown complete');
    process.exit(0);
  });
};

// Register shutdown handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the health service
const start = async () => {
  try {
    // Start Fastify server
    const address = await fastify.listen({
      port: PORT,
      host: '0.0.0.0'
    });
    
    fastify.log.info(`Health service for ${INDEXER_NAME} started at ${address}`);
    
    // Start the indexer process
    await startIndexer();
    
  } catch (err:any) {
    fastify.log.error('Error starting health service:', err);
    process.exit(1);
  }
};

// Start the application
start();
