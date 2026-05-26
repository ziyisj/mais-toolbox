export {};

declare global {
  interface Window {
    mais?: {
      ping: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      resolveLink: (raw: string) => Promise<
        { ok: true; url: string } | { ok: false; error: string }
      >;
      fetchProduct: (raw: string) => Promise<
        | {
            ok: true;
            product: {
              platform: string;
              itemId: string;
              sourceUrl: string;
              title: string;
              price: number;
              description: string;
              mainImage: string | null;
              images: { url: string; alt?: string }[];
            };
          }
        | { ok: false; error: string; code: string }
      >;
    };
  }
}
