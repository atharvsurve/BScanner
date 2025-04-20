
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyApprbNh-WekHvaCJ_UJDVynDSW8_aaIVw';
const genAI = new GoogleGenerativeAI(API_KEY);

function fileToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString('base64');
}

exports.processImage = async (imagePath) => {
  try {
    const imageBase64 = fileToBase64(imagePath);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are an OCR and data extraction AI. Extract the following from the business card image: 
              - Name
              - Email
              - Phone
              - Company
              - Job Title
              - Website
              
              Respond strictly in JSON format like:
              {
                "name": "...",
                "email": "...",
                "phone": "...",
                "company": "...",
                "jobTitle": "...",
                "website": "..."
              }`,
            },
            {
              inlineData: {
                mimeType: 'image/jpeg', // or image/png based on file
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const textResponse = result.response.text();

    // Clean and extract JSON content from Markdown formatting
    const cleanText = textResponse
      .replace(/^```json/, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    try {
      return JSON.parse(cleanText);
    } catch (err) {
      return {
        rawResponse: textResponse,
        cleaned: cleanText,
        warning: 'Still could not parse JSON',
      };
    }
  } catch (error) {
    console.error('Gemini Error:', error);
    throw error;
  }
};
