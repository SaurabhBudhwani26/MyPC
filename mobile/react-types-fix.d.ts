// Complete React 19 compatibility fix
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

    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Simplified React module augmentation - only essential overrides
declare module 'react' {
  // Essential React exports
  export function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prevState: S) => S)) => void];
  export function useEffect(effect: () => (void | (() => void | undefined)), deps?: readonly any[]): void;
  export function useContext<T>(context: Context<T>): T;
  export function createContext<T>(defaultValue: T): Context<T>;
  export function createElement(type: any, props?: any, ...children: any[]): any;
  export const Fragment: any;

  // Type exports
  export type ReactNode = any;
  export interface Context<T> {
    Provider: any;
    Consumer: any;
  }

  const React: {
    useState: typeof useState;
    useEffect: typeof useEffect;
    useContext: typeof useContext;
    createContext: typeof createContext;
    createElement: typeof createElement;
    Fragment: typeof Fragment;
  };
  export default React;
}

declare module 'prop-types' {
  export interface Validator<T> {
    (props: any, propName: string, componentName: string, location: any, propFullName: string): Error | null;
  }
}
