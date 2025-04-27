const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();


const API_KEY = process.env.GEMINI_API_KEY ;
const genAI = new GoogleGenerativeAI(API_KEY);

function fileToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString('base64');
}

function getMimeType(filePath) {
  const extension = filePath.split('.').pop().toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    default:
      return 'image/jpeg'; // Default fallback
  }
}

exports.processImage = async (imagePath) => {
  try {
    console.log(`Processing image at: ${imagePath}`);
    const imageBase64 = fileToBase64(imagePath);
    const mimeType = getMimeType(imagePath);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Creating a more specific prompt with explicit formatting instructions
    const prompt = `
You are a specialized business card OCR system. Extract ONLY the following fields from the business card image:
- name (full name of the person)
- email (email address)
- phone (phone number)
- company (company or organization name)
- jobTitle (person's job title or position)
- website (company website URL)
- address (physical address if present)

Format your response as a valid JSON object with these exact keys. Include ONLY the extracted information, nothing else.
If a field is not found in the image, use an empty string for its value.
DO NOT include any explanations, notes, code blocks, or markdown formatting in your response.
The response should be EXCLUSIVELY a raw JSON object that can be directly parsed.

Example of expected output:
{"name":"John Smith","email":"john@example.com","phone":"(555) 123-4567","company":"Acme Inc","jobTitle":"CEO","website":"www.acme.com","address":"123 Business St, City, State 12345"}
`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent output
        maxOutputTokens: 1024,
      },
    });

    const textResponse = result.response.text();
    console.log('Raw Gemini response:', textResponse);

    // First, try to parse the response directly - it might already be clean JSON
    try {
      return JSON.parse(textResponse);
    } catch (directParseError) {
      console.log('Direct JSON parse failed, trying cleanup methods');
    }

    // Try multiple cleanup approaches
    let cleanText = textResponse;
    
    // 1. Remove code block markers if present
    cleanText = cleanText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
      
    // 2. Try to extract JSON content using regex
    const jsonMatch = cleanText.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[0]) {
      cleanText = jsonMatch[0];
    }
    
    // 3. Remove any control characters that might break JSON parsing
    cleanText = cleanText.replace(/[\x00-\x1F\x7F]/g, "");
    
    try {
      const parsedData = JSON.parse(cleanText);
      return parsedData;
    } catch (cleanupParseError) {
      console.error('Failed to parse JSON after cleanup:', cleanupParseError);
      
      // Return both raw and cleaned text for debugging
      return {
        rawResponse: textResponse,
        cleaned: cleanText,
        error: cleanupParseError.message,
      };
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};