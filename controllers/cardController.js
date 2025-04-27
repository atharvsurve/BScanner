const geminiService = require('../services/geminiServices');
const fs = require('fs');
const Card = require('../models/Card'); // Import the Card model
const User = require('../models/User'); // Adjust path as needed

const fs = require('fs');

const validateCardData = (data) => {
  // At minimum, a business card should have either a name or company
  return data && (data.name || data.company || data.email || data.phone);
};

exports.extractCardDetails = async (req, res) => {
  let imagePath = null;
  
  try {
    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image uploaded' 
      });
    }

    imagePath = req.file.path;
    console.log(`Processing image at path: ${imagePath}`);
    
    // Process the image using Gemini service - our improved service should handle JSON parsing
    const result = await geminiService.processImage(imagePath);
    
    // Check if we got a structured result or an error object
    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process image with Gemini service'
      });
    }
    
    // If the result contains rawResponse, it means JSON parsing failed
    if (result.rawResponse) {
      console.warn('Gemini returned non-JSON response:', result);
      return res.status(422).json({
        success: false,
        message: 'Failed to parse business card details',
        rawResponse: result.rawResponse.substring(0, 500),
        cleaned: result.cleaned
      });
    }
    
    // Validate the extracted data
    if (!validateCardData(result)) {
      console.warn('Extracted data failed validation:', result);
      return res.status(422).json({
        success: false,
        message: 'Failed to extract valid business card details',
        extractedData: result
      });
    }
    
    // Success - return the structured data
    return res.status(200).json({
      success: true,
      structuredData: result
    });
    
  } catch (error) {
    console.error('Error in extractCardDetails:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to extract card details',
      error: error.message
    });
  } finally {
    // Clean up the uploaded file
    if (imagePath && fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
        console.log(`Cleaned up temporary file: ${imagePath}`);
      } catch (unlinkError) {
        console.error('Failed to delete temporary file:', unlinkError);
      }
    }
  }
};


exports.submitCardDetails = async (req, res) => {
  try {
    const cardData = req.body;
    const userId = req.user.id; // Assuming you have authentication middleware that sets req.user
    console.log('Incoming user ID:', req.user?._id);
console.log('Incoming card data:', req.body);

    // Basic validation (including the new website field)
    const requiredFields = ['name', 'email', 'phone', 'company'];
    const missingFields = requiredFields.filter(field => !cardData[field]);

    if (missingFields.length) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new card object
    const newCard = {
      name: cardData.name,
      email: cardData.email,
      phone: cardData.phone,
      company: cardData.company,
      website: cardData.website || '',  // Handle optional website field
      createdAt: Date.now()
    };

    // Add card to user's businessCards array
    user.businessCards.push(newCard);
    await user.save();

    return res.status(200).json({
      message: 'Card details added to user successfully',
      data: newCard
    });
  } catch (error) {
    console.error('Error in submitCardDetails:', error.message);
    return res.status(500).json({ error: 'Failed to submit card details' });
  }
};


exports.getAllCards = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming authentication middleware sets req.user
    
    // Find the user and get their cards
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Fetched all card details successfully',
      data: user.businessCards
    });
  } catch (error) {
    console.error('Error in getAllCards:', error.message);
    res.status(500).json({ error: 'Failed to fetch card details' });
  }
};

exports.deleteCardById = async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id; // Assuming authentication middleware sets req.user

    if (!cardId) {
      return res.status(400).json({ message: 'Card ID is required' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the index of the card in the businessCards array
    const cardIndex = user.businessCards.findIndex(card => card._id.toString() === cardId);
    
    if (cardIndex === -1) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Store the card to return in the response
    const deletedCard = user.businessCards[cardIndex];
    
    // Remove the card from the array
    user.businessCards.splice(cardIndex, 1);
    
    // Save the updated user document
    await user.save();

    res.status(200).json({
      message: 'Card deleted successfully',
      data: deletedCard
    });
  } catch (error) {
    console.error('Error in deleteCardById:', error.message);
    res.status(500).json({ error: 'Failed to delete card' });
  }
};
