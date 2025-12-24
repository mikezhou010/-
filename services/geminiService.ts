import { GoogleGenAI, Type } from "@google/genai";
import { Project, ConsultantProfile } from "../types";

const apiKey = process.env.API_KEY || '';

// Helper to check if is enabled
export const isAiEnabled = () => !!apiKey;

// Initialize Client (Lazy)
const getAiClient = () => {
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

/**
 * Uses Gemini to suggest which consultants are a good match for a project
 */
export const recommendConsultantsForProject = async (
    project: Project,
    consultants: ConsultantProfile[]
): Promise<string[]> => {
    const ai = getAiClient();
    if (!ai) return [];

    const consultantsContext = consultants.map(c => 
        `ID: ${c.userId}, Skills: ${c.skills.join(', ')}, Role: ${c.title}, Bio: ${c.bio}`
    ).join('\n');

    const prompt = `
        I have a project described as follows:
        Title: ${project.title}
        Description: ${project.description}
        Required Skills: ${project.requiredSkills.join(', ')}

        Here is a list of consultants:
        ${consultantsContext}

        Identify the IDs of the top 3 consultants who are best suited for this project based on skills and background.
        Return ONLY a JSON array of their IDs (e.g., ["cons1", "cons3"]). Do not explain.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Recommendation Error:", error);
        return [];
    }
};

/**
 * Uses Gemini to generate a project summary or key requirements from a rough description
 */
export const optimizeProjectDescription = async (rawDescription: string): Promise<{ refined: string, skills: string[] }> => {
    const ai = getAiClient();
    if (!ai) return { refined: rawDescription, skills: [] };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
                Refine the following project description to be more professional and extract key technical skills required.
                Description: "${rawDescription}"
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        refinedDescription: { type: Type.STRING },
                        extractedSkills: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return { refined: rawDescription, skills: [] };
        
        const data = JSON.parse(text);
        return {
            refined: data.refinedDescription,
            skills: data.extractedSkills
        };

    } catch (error) {
        console.error("Gemini Optimization Error:", error);
        return { refined: rawDescription, skills: [] };
    }
};

/**
 * Generates a professional avatar based on a prompt
 */
export const generateAvatarImage = async (prompt: string): Promise<string | null> => {
    const ai = getAiClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: "Generate a professional, high-quality profile picture (headshot) for a business resume or corporate profile. Style: " + prompt }
                ]
            }
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                     return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Gemini Image Gen Error:", error);
        return null;
    }
};