/// <reference types="react" />
/// <reference types="react-native" />

// Force React Native components to be JSX compatible
declare module 'react-native' {
  export interface ComponentType<P = any> {
    (props: P): JSX.Element | null;
  }

  export const View: ComponentType<any>;
  export const Text: ComponentType<any>;
  export const ScrollView: ComponentType<any>;
  export const TouchableOpacity: ComponentType<any>;
  export const StyleSheet: {
    create: <T>(styles: T) => T;
  };
  export const Alert: {
    alert: (title: string, message?: string) => void;
  };
}

// Override JSX namespace to accept React Native components
declare global {
  namespace JSX {
    interface Element {
      type: any;
      props: any;
      key?: string | number | null;
    }
    interface ElementClass {
      render(): JSX.Element | null;
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
