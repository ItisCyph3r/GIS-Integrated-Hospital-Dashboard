import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Admin } from 'kafkajs';
import { createKafkaConfig } from './kafka-config.factory';

@Injectable()
export class KafkaTopicsService implements OnModuleInit, OnModuleDestroy {
  private admin: Admin;

  async onModuleInit() {
    if (process.env.KAFKA_SSL !== 'true') {
      return;
    }

    try {
      const kafka = new Kafka(
        createKafkaConfig('kafka-admin', {
          logLevel: (process.env.NODE_ENV === 'production' ? 1 : 3) as number,
        }),
      );

      this.admin = kafka.admin();
      await this.admin.connect();

      const topics = [
        {
          topic: 'ambulance.locations.v1',
          numPartitions: 3,
          replicationFactor: 1,
        },
        {
          topic: 'ambulance.status.changed.v1',
          numPartitions: 3,
          replicationFactor: 1,
        },
      ];

      const existingTopics = await this.admin.listTopics();
      const topicsToCreate = topics.filter(
        (t) => !existingTopics.includes(t.topic),
      );

      if (topicsToCreate.length > 0) {
        await this.admin.createTopics({
          topics: topicsToCreate,
          waitForLeaders: true,
        });
        console.log('--------------------------------');
        console.log(
          `Created Kafka topics: ${topicsToCreate.map((t) => t.topic).join(', ')}`,
        );
        console.log('--------------------------------');
      } else {
        console.log('--------------------------------');
        console.log('All Kafka topics already exist');
        console.log('--------------------------------');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to create Kafka topics:', errorMessage);
    }
  }

  async onModuleDestroy() {
    if (this.admin) {
      await this.admin.disconnect();
    }
  }
}
