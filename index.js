const express = require('express');
const admin = require('firebase-admin');
var serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://book-my-resource-6d610-default-rtdb.firebaseio.com/' // Replace with your database URL
});

// Initialize the database
const db = admin.database();

// Initialize the Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * API routes
 */
const usersRef = db.ref("resources");

// Route to add a new resource
app.post('/resources', (req, res) => {
    const { name, email } = req.body; // Get name and email from request body

    // Generate a unique key by creating a new child under 'resources'
    const newUserRef = usersRef.push(); // This generates a unique key

    // Set data at the new reference
    newUserRef.set({
        name,
        email
    }).then(() => {
        res.status(201).json({ message: 'Resource added successfully', id: newUserRef.key });
    }).catch((error) => {
        console.error("Error saving resource data:", error);
        res.status(500).json({ error: error.message });
    });
});

// Route to get all resources
app.get('/resources', (req, res) => {
    usersRef.once('value', (snapshot) => {
        res.status(200).json(snapshot.val());
    }, (error) => {
        res.status(500).json({ error: error.message });
    });
});

/**
 * Start the server
 */
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.debug(`Started running backend server on port: ${PORT}`);
});
