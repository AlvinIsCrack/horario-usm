const GAS_API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz5PHmGAXmMB4YX4tjoMrj-wJTGSnGTkNS-lRWcjT9IGklXqr8uVi5jQ-3fa4gkBa4Z/exec';

export async function fetchPDF(targetPdfUrl: string) {
    const response = await fetch(`${GAS_API_ENDPOINT}?url=${encodeURIComponent(targetPdfUrl)}`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error);
    }

    // Convert Base64 back to binary Blob in the browser
    const byteCharacters = atob(data.base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: data.contentType });

    // Now you can use this Blob to create an Object URL for an iframe, PDF.js, etc.
    // const fileUrl = URL.createObjectURL(blob);
    return blob;
}