declare module 'sanitize-html' {
  export interface SanitizeDefaults {
    allowedTags: string[];
    allowedAttributes: Record<string, string[]>;
    [k: string]: any;
  }
  export interface SanitizeHtml {
    (input?: string, opts?: any): string;
    defaults: SanitizeDefaults;
    simpleTransform: (tagName: string, attribs?: Record<string, any>, merge?: boolean) => any;
  }
  const sanitizeHtml: SanitizeHtml;
  export default sanitizeHtml;
}
