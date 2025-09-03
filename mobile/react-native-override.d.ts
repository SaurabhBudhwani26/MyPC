// React 19 JSX compatibility override
declare global {
  namespace JSX {
    interface Element {
      type: any;
      props: any;
      key: any;
      ref: any;
      children?: any;
    }

    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

// Explicit React Native component declarations to fix React 19 compatibility
declare module 'react-native' {
  import { ComponentType } from 'react';

  // Force all React Native components to be valid JSX components
  export const View: any;
  export const Text: any;
  export const ScrollView: any;
  export const TouchableOpacity: any;
  export const Pressable: any;
  export const Image: any;
  export const Button: any;
  export const TextInput: any;
  export const FlatList: any;
  export const SectionList: any;
  export const Modal: any;
  export const Switch: any;
  export const ActivityIndicator: any;
  export const Linking: any;
  export const Appearance: any;
  export const ColorSchemeName: any;
  export const KeyboardAvoidingView: any;

  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
  };

  export const Alert: {
    alert: (title: string, message?: string, buttons?: any[]) => void;
  };

  export const Dimensions: {
    get: (dimension: 'window' | 'screen') => { width: number; height: number };
  };

  export const Platform: {
    OS: 'ios' | 'android' | 'web';
    select: <T>(config: { ios?: T; android?: T; web?: T; default?: T }) => T;
  };

  export const AppRegistry: {
    registerComponent: (appName: string, getComponentFunc: () => any) => void;
  };
}
