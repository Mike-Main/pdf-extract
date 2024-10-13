import { Component } from '@angular/core';
import axios from 'axios';
import { LoadingController } from '@ionic/angular';

interface ExtractedFile {
  fileName: string;
  text: string;
  error?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  extractedFiles: ExtractedFile[] = [];
  isLoading = false;
  private readonly apiKey = ''; // Replace with your OCR.Space API key

  constructor(private loadingCtrl: LoadingController) {}

  async onFileSelected(event: any) {
    const files = event.target.files;

    if (files && files.length > 0) {
      this.isLoading = true;
      // Process each file one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await this.processFile(file);
      }
      this.isLoading = false;
    }
  }

  async processFile(file: File) {
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // Read file as Data URL for image input

      reader.onload = async () => {
        const imageDataUrl = reader.result as string;
        await this.extractTextFromImage(imageDataUrl, file.name);
        resolve(); // Resolve the promise once the file is processed
      };

      reader.onerror = (error) => {
        console.error(`Error reading file ${file.name}:`, error);
        this.extractedFiles.push({
          fileName: file.name,
          text: 'Error reading file',
        });
        resolve(); // Resolve the promise even if there is an error
      };
    });
  }

  async extractTextFromImage(imageDataUrl: string, fileName: string) {
    try {
      const formData = new FormData();
      formData.append('base64Image', imageDataUrl);

      const response = await axios.post('https://api.ocr.space/parse/image', formData, {
        headers: {
          apikey: this.apiKey,
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;
      if (result && result.ParsedResults && result.ParsedResults.length > 0) {
        this.extractedFiles.push({
          fileName,
          text: result.ParsedResults[0].ParsedText.trim(),
        });
      } else {
        this.extractedFiles.push({
          fileName,
          text: 'No text found',
        });
      }
    } catch (error: unknown) {
      console.error(`Error extracting text from ${fileName} with OCR.Space:`, error);
      const errorMessage = this.getErrorMessage(error);
      this.extractedFiles.push({
        fileName,
        text: 'Error extracting text',
        error: errorMessage,
      });
    }
  }

  private getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return error.message;
    } else if (error instanceof Error) {
      return error.message;
    } else {
      return 'Unknown error';
    }
  }
}

