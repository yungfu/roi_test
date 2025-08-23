import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { App } from './App';
import { ROIData } from './ROIData';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  @IsNotEmpty()
  placementDate: Date; // 投放日期

  @Column()
  @IsNotEmpty()
  @IsString()
  bidType: string; // 出价类型

  @Column({ type: 'int' })
  @IsNumber()
  installCount: number; // 安装次数

  @Column()
  @IsNotEmpty()
  @IsString()
  country: string; // 国家地区
  
  // 关联到App
  @ManyToOne(() => App, app => app.campaigns)
  @JoinColumn({ name: 'appId' })
  app: App;

  @Column()
  appId: string;

  // 关联到ROI数据
  @OneToMany(() => ROIData, roiData => roiData.campaign)
  roiData: ROIData[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
