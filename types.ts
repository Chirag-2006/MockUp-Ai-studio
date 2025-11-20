export enum AppMode {
  MOCKUP = 'MOCKUP',
  IMAGE_GEN = 'IMAGE_GEN'
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: number;
  type: 'mockup' | 'generation';
}

export interface MockupPreset {
  id: string;
  name: string;
  icon: string; // Emoji icon
  promptTemplate: string;
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '4:3',
  WIDE = '16:9',
  TALL = '9:16'
}