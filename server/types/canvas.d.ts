declare global {
    interface Window {
        ImageData: typeof ImageData;
    }
}

declare class NodeImageData implements ImageData {
    readonly data: Uint8ClampedArray;
    readonly height: number;
    readonly width: number;
    constructor(data: Uint8ClampedArray, width: number, height: number);
}

declare module 'canvas' {
    export interface Canvas extends HTMLCanvasElement {
        getContext(contextId: '2d'): CanvasRenderingContext2D;
        toDataURL(): string;
    }

    export interface Image extends HTMLImageElement {
        src: string;
        onload: () => void;
    }

    export function createCanvas(width: number, height: number): Canvas;
    export function loadImage(src: string): Promise<Image>;
    export const Canvas: typeof HTMLCanvasElement;
    export const Image: typeof HTMLImageElement;
    export const ImageData: typeof globalThis.ImageData;
} 