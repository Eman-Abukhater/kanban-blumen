export declare const generateId: () => string;
export declare const formatDate: (date: Date) => string;
export declare const validateEmail: (email: string) => boolean;
export declare const slugify: (text: string) => string;
export declare const truncateText: (text: string, maxLength: number) => string;
export declare const isValidUrl: (string: string) => boolean;
export declare const sanitizeFilename: (filename: string) => string;
export declare const getFileExtension: (filename: string) => string;
export declare const formatFileSize: (bytes: number) => string;
export declare class APICache {
    private static cache;
    private static readonly DEFAULT_TTL;
    static get(key: string): any | null;
    static set(key: string, data: any, ttl?: number): void;
    static clear(): void;
    static cleanup(): void;
    static generateKey(req: any): string;
}
export declare const cachedResponse: (ttl?: number) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=helpers.d.ts.map