import { process } from "./.processor";

export const PDFProcessor = {
    process(url: string) {
        return process(url);
    }
}