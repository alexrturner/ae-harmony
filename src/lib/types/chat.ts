import type { BaseModel } from 'pocketbase';

export interface Chat extends BaseModel {
  totalSize: number;
  lastMessageDate: string;
  color: string;
  normalizedSize: number;
  participants?: string[]; // IDs
  participantNames?: string[]; // usernames
  participantColors?: string[]; // colors
}

export interface Message extends BaseModel {
  chat: string;
  audioFile: any;
  created: string;
  userId: string;
  userName: string;
}

export interface TreemapNode {
  name: string;
  value: number;
  color: string;
  id: string;
} 