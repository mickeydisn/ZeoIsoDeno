/**
 * Uploader.ts (Client-side TypeScript file)
 * Reusable class for pushing various data types to the server.
 */

export class Uploader {
    private serverUrl: string;
  
    constructor(serverUrl: string = "http://localhost:8081") {
      this.serverUrl = serverUrl;
    }
  
    /**
     * Pushes an OffscreenCanvas as a PNG image to the server.
     * @param canvas The OffscreenCanvas object.
     * @param path The server-side path/filename (e.g., 'screenshots/my_image.png').
     * @returns A promise that resolves to true on success, or false on failure.
     */
    public async uploadCanvasImage(canvas: OffscreenCanvas, path: string, file: string): Promise<boolean> {
      try {
        // 1. Convert the canvas to a Blob
        const blob = await canvas.convertToBlob({ type: "image/png" });
  
        // 🚨 NEW CHECK: Validate the Blob before sending
        if (blob.size === 0) {
            console.error("🚨 Canvas conversion failed: Resulting image Blob is empty (size 0).");
            return false;
        }

        // 2. Prepare the Form Data
        const formData = new FormData();
        formData.append("file", blob, file); // 'file' matches the server handler
        formData.append("path", path + file); // 'path' matches the server handler
  
        // 3. Send the request
        const response = await fetch(`${this.serverUrl}/upload/image`, {
          method: "POST",
          body: formData,
        });
  
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Image upload failed: ${response.status} - ${errorBody}`);
          return false;
        }
  
        console.log(`Canvas image uploaded successfully to ${path}`);
        return true;
      } catch (error) {
        console.error("An error occurred during canvas image upload:", error);
        return false;
      }
    }
  
    /**
     * Pushes a text string to the server as a file.
     * @param textContent The text content to save.
     * @param path The server-side path/filename (e.g., 'logs/data.txt').
     * @returns A promise that resolves to true on success, or false on failure.
     */
    public async uploadTextFile(textContent: string, path: string): Promise<boolean> {
      try {
        // 1. Prepare the Form Data
        const formData = new FormData();
        formData.append("content", textContent); // 'content' matches the server handler
        formData.append("path", path); // 'path' matches the server handler
  
        // 2. Send the request
        const response = await fetch(`${this.serverUrl}/upload/text`, {
          method: "POST",
          body: formData,
        });
  
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Text file upload failed: ${response.status} - ${errorBody}`);
          return false;
        }
  
        console.log(`Text file uploaded successfully to ${path}`);
        return true;
      } catch (error) {
        console.error("An error occurred during text file upload:", error);
        return false;
      }
    }
  }
  
  /* Example Usage (in your client code):
  // Assuming you have an OffscreenCanvas named 'myOffscreenCanvas' and some text 'myLogText'
  
  // Create an instance of the uploader
  const uploader = new Uploader('http://localhost:8081'); // Or omit the URL if running on the same domain/port
  
  // 1. Upload the image
  const imageSuccess = await uploader.uploadCanvasImage(
    myOffscreenCanvas, 
    'user_data/session_123/screenshot.png'
  );
  console.log('Image Upload Result:', imageSuccess);
  
  // 2. Upload the text
  const textSuccess = await uploader.uploadTextFile(
    myLogText, 
    'user_data/session_123/log.json'
  );
  console.log('Text Upload Result:', textSuccess);
  */