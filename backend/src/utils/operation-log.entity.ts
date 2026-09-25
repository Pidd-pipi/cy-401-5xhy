import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 16 })
  method: string;

  @Column({ length: 255 })
  path: string;

  @Column()
  statusCode: number;

  @Column()
  durationMs: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  userId?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
