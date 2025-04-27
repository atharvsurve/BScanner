const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');// Create a config file for your JWT_SECRET


const JWT_SECRET = 'your_jwt_secret_key';
// Signup controller
exports.signup = async (req, res) => {
  const { name, email, password } = req.body; // 👈 take role also

  try {
    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user',  // 👈 set role if provided, else default to 'user'
    });

    // Save user to the database
    await user.save();

    // Generate JWT
    const payload = {
      user: {
        id: user._id,
      },
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    // Send response with token
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Login controller
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user._id,
      },
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    // Send response with token
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


exports.getProfile = async (req, res) => {
  try {
    // Find user by ID (req.user.id is set by authMiddleware)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prepare user data to send
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.json({ user: userData });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Check if the requesting user is an admin
    const requestingUser = await User.findById(req.user.id);
    
    if (!requestingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify the user has admin role
    if (requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required' });
    }
    
    // If admin, fetch ALL users
    const allUsers = await User.find({});
    
    // Map users to include businessCards and necessary fields
    const usersData = allUsers.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      cards: user.businessCards || [] // Include the business cards
    }));
    
    // Return an array of users directly
    res.status(200).json(usersData);
    
  } catch (error) {
    console.error('Error in getAllUsers:', error.message);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params; // get user id from URL

    const requestingUser = await User.findById(req.user.id);

    if (!requestingUser) {
      return res.status(404).json({ message: 'Requesting user not found' });
    }

    if (requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required' });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found to delete' });
    }

    res.status(200).json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({ error: 'Server error while deleting user' });
  }
};

