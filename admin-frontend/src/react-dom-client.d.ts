declare module 'react-dom/client' {
  import { ReactNode } from 'react';

  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }

  export interface RootOptions {
    hydrate?: boolean;
    hydrationOptions?: {
      onHydrated?: (suspenseInstance: any) => void;
      onDeleted?: (suspenseInstance: any) => void;
    };
  }

  export function createRoot(
    container: Element | DocumentFragment,
    options?: RootOptions
  ): Root;
}
