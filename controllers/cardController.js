const geminiService = require('../services/geminiServices');
const fs = require('fs');
const Card = require('../models/Card'); // Import the Card model
const User = require('../models/User'); // Adjust path as needed

// Helper function to clean JSON string
const cleanJsonString = (jsonString) => {
  // Remove control characters (except for \t, \n, \r)
  return jsonString.replace(/[\x00-\x1F\x7F]/g, "");
};

exports.extractCardDetails = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const imagePath = req.file.path;
    const result = await geminiService.processImage(imagePath);

    // Optional: delete file after processing
    fs.unlinkSync(imagePath);

    // Get the raw response
    const raw = result?.rawResponse || result?.cleaned || '';
    
    // Use regex to extract JSON object from the response
    const match = raw.match(/\{.*\}/s);
    const jsonOutput = match ? match[0] : null;
    
    // Clean and parse the JSON
    let parsedData = {};
    try {
      parsedData = JSON.parse(cleanJsonString(jsonOutput) || "{}");
    } catch (e) {
      console.warn('JSON parse failed:', e.message);
    }

    res.status(200).json({ structuredData: parsedData });
  } catch (error) {
    console.error('Error in extractCardDetails:', error.message);
    res.status(500).json({ error: 'Failed to extract card details' });
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
