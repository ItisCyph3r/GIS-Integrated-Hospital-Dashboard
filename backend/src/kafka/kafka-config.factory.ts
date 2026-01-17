import { KafkaConfig } from 'kafkajs';

/**
 * Factory function to create Kafka configuration with optional SSL support
 */
export function createKafkaConfig(
  clientId: string,
  additionalConfig?: Partial<KafkaConfig>,
): KafkaConfig {
  const baseConfig: KafkaConfig = {
    clientId,
    brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
    ...additionalConfig,
  };

  if (process.env.KAFKA_SSL === 'true') {
    const caCert = process.env.KAFKA_CA_CERT;
    const accessCert = process.env.KAFKA_ACCESS_CERT;
    const accessKey = process.env.KAFKA_ACCESS_KEY;

    if (!caCert || !accessCert || !accessKey) {
      throw new Error(
        'KAFKA_SSL is enabled but missing required certificates. Please set KAFKA_CA_CERT, KAFKA_ACCESS_CERT, and KAFKA_ACCESS_KEY',
      );
    }

    const cleanCert = (cert: string) => {
      return cert
        .replace(/^["']|["']$/g, '')
        .replace(/\\n/g, '\n')
        .trim();
    };

    baseConfig.ssl = {
      rejectUnauthorized: true,
      ca: [cleanCert(caCert)],
      cert: cleanCert(accessCert),
      key: cleanCert(accessKey),
    };
  }

  return baseConfig;
}
