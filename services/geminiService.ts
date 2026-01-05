
import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export interface ImagePart {
  data: string;
  mimeType: string;
}

export const generatePolaroidImage = async (prompt: string, background: string, accessories: string[]): Promise<string> => {
  const ai = getAIClient();
  
  const accessoryInstruction = accessories.length > 0 
    ? `\nAccessories: ${accessories.join(', ')}. Ensure they fit naturally on the heads and faces of all people.` 
    : "";

  const fullPrompt = `
    A professional, natural polaroid-style photograph. 
    Stylistic elements: Realistic grainy texture, soft flash lighting coming from a dim room camera source, and a very slight motion blur.
    
    Subject matter: A group photo of two people standing close together, hugging and looking directly at the camera with a warm smile. ${prompt}
    
    Setting:
    - Background: ${background}
    ${accessoryInstruction}
    
    Constraints: 
    - High quality, photographic realism.
    - Avoid digital sharpness; maintain authentic analog look.
    - No added text or graphics in the photo area.
    - Maintain natural human features and do not alter faces beyond the requested accessories.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: fullPrompt }
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error("No image data received from API");
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Could not find image part in response");
};

export const editToPolaroid = async (images: ImagePart[], prompt: string, background: string, accessories: string[]): Promise<string> => {
  const ai = getAIClient();
  const personCount = images.length;
  
  const accessoryInstruction = accessories.length > 0 
    ? `\n- Add these accessories to EVERY person in the photo: ${accessories.join(', ')}. Ensure they are correctly placed and adapt naturally to each person's head and face structure.` 
    : "";

  const fullPrompt = `
    Create a single, natural Polaroid-style group photo featuring exactly ${personCount} people, using the faces from the provided images.
    
    Composition: A group photo where all ${personCount} people from the input photos are standing together, hugging or arms around each other, looking directly at the camera with a smile. It should feel like a single cohesive candid moment. ${prompt}.
    
    Styling:
    - Style: Classic Polaroid with authentic grain and soft focus.
    - Background: ${background}.
    - Lighting: Consistent light source, specifically a camera flash from a dim room, creating natural shadows across the group.
    - Effects: Add a slight blur to simulate an instant camera lens.
    ${accessoryInstruction}
    - CRITICAL: Do not alter the faces of the people; they must remain recognizable and consistent with the input images for all ${personCount} individuals.
  `;

  const imageParts = images.map(img => ({
    inlineData: {
      data: img.data.split(',')[1],
      mimeType: img.mimeType,
    },
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        ...imageParts,
        { text: fullPrompt },
      ],
    },
  });

  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error("No image data received from API during editing");
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Could not find edited image part in response");
};
