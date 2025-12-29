import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.battleplan.app',
  appName: 'Battleplan',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
