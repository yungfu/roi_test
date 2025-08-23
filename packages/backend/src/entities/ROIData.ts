import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Campaign } from './Campaign';

@Entity('roi_data')
@Index(['campaignId', 'daysPeriod'], { unique: true }) // 确保同一活动的同一周期只有一条记录
export class ROIData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  @IsNumber()
  @IsPositive()
  daysPeriod: number; // ROI周期天数 (0=当日, 1=1日, 3=3日, 7=7日, 14=14日, 30=30日, 60=60日, 90=90日)

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  @IsNumber()
  roiValue: number; // ROI值

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  @IsNumber()
  isReal0Roi: boolean; // 是否为真实的0 ROI (而非缺失数据)

  // 关联到Campaign
  @ManyToOne(() => Campaign, campaign => campaign.roiData)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  campaignId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
