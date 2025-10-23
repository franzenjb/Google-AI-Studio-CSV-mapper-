import { GoogleGenAI, Type } from "@google/genai";
import { GeocodedLocation } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        location: {
          type: Type.STRING,
          description: 'The original location string provided in the input.',
        },
        lat: {
          type: Type.NUMBER,
          description: 'The latitude of the location.',
        },
        lng: {
          type: Type.NUMBER,
          description: 'The longitude of the location.',
        },
      },
      required: ["location", "lat", "lng"],
    },
  };

export const geocodeLocations = async (locations: string[]): Promise<GeocodedLocation[]> => {
  const model = "gemini-2.5-flash";

  const prompt = `You are a geocoding expert. Find the precise latitude and longitude for this list of locations. If a location is ambiguous or cannot be found, omit it from your response. Locations: ${JSON.stringify(locations)}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("Gemini API returned an empty response.");
    }
    
    const parsedResponse = JSON.parse(jsonText);
    return parsedResponse as GeocodedLocation[];

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to geocode locations. Please check your locations and try again.");
  }
};
