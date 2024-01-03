type Type = 'udp' | 'tcp';
export declare function pickPort({ type, ip, minPort, maxPort, reserveTimeout }?: {
    type?: Type;
    ip?: string;
    minPort?: number;
    maxPort?: number;
    reserveTimeout?: number;
}): Promise<number>;
export {};
//# sourceMappingURL=index.d.ts.map