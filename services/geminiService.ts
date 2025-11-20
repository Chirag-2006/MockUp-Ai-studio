import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio } from "../types";

// Initialize the client once
// The API key is injected automatically into process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Edit/Transform an image using Gemini 2.5 Flash Image.
 * This is used for the "Mockup" feature where the user's logo (image) 
 * is transformed into a product shot based on the prompt.
 */
export const generateMockup = async (
  base64Image: string, 
  mimeType: string, 
  prompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // Extract image from response
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts && parts[0]?.inlineData) {
      const base64ImageBytes = parts[0].inlineData.data;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    
    throw new Error("No image generated in response");
  } catch (error) {
    console.error("Mockup generation failed:", error);
    throw error;
  }
};

/**
 * Generate a high-quality image from scratch using Imagen 4.0.
 */
export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio = AspectRatio.SQUARE
): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
      },
    });

    const generatedImages = response.generatedImages;
    if (generatedImages && generatedImages.length > 0) {
      const base64ImageBytes = generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }

    throw new Error("No image generated");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};