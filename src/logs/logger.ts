import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export class WinstonLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    // Ensure the node URL is available; fallback to a default value if not set
    const esNodeUrl = process.env.ELASTICSEARCH_HOST || 'http://localhost:9200';

    // Configuration for Elasticsearch transport
    const esTransportOpts = {
      level: 'info',
      clientOpts: { node: esNodeUrl },
    };

    // Initialize the logger with Elasticsearch and console transports
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new ElasticsearchTransport(esTransportOpts),
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
      ],
    });

    // Handle any connection errors with Elasticsearch
    this.logger.on('error', (err) => {
      console.error('Elasticsearch Transport Error:', err.message);
    });
  }

  // Log an informational message
  log(message: string) {
    this.logger.info(message);
  }

  // Log an error message
  error(message: string) {
    this.logger.error(message);
  }
}

export const winstonLoggerService = new WinstonLoggerService();
