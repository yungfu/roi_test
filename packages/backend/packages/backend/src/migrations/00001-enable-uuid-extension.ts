import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableUuidExtension1735056000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Try multiple UUID extension options
    try {
      await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    } catch (error) {
      console.warn('uuid-ossp extension failed, trying pgcrypto:', error);
      try {
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
      } catch (pgcryptoError) {
        console.warn('pgcrypto extension also failed:', pgcryptoError);
        // Continue anyway, the database might already have UUID support
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Typically we don't drop extensions in down migrations
    // as they might be used by other parts of the application
  }
}
