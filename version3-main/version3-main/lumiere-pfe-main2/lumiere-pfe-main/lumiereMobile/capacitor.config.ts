import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Otflow',
  webDir: 'www',
  server: {
    // Allow the app to make requests to your backend server
    androidScheme: 'http',
    cleartext: true,
    // This allows the app to connect to your PC's IP address
    allowNavigation: [
      '*'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#D97706",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;

