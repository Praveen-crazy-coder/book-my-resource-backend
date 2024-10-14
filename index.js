const express = require('express');
const admin = require('firebase-admin');
var serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);
const cors = require('cors');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://book-my-resource-6d610-default-rtdb.firebaseio.com/'
});

// Initialize the database
const db = admin.database();

// Initialize the Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000', 'https://book-my-resource.web.app']
}));

function generateAutoId(ref) {
    // Get next available ID.
    return ref.child("counter").transaction((currentId) => {
        return (currentId || 0) + 1;
    }).then((snapshot) => {
        if (snapshot.committed) {
            return snapshot.snapshot.val();
        } else {
            throw new Error("Could not generate a new ID.");
        }
    });
}

/**
 * API routes
 */
const resourcesRef = db.ref("resources");
const bookingRef = db.ref("bookings")

// Route to get all resources
app.get('/resources', (req, res) => {
    resourcesRef.once('value', (snapshot) => {
        const resources = snapshot.val();
        const resourcesWithIds = Object.keys(resources || {}).map((key, index) => {
            return {...resources[key], id: index + 1};
        });
        res.status(200).json(resourcesWithIds);
    }, (error) => {
        res.status(500).json({error: error.message});
    });
});

app.post('/create-resource', (req, res) => {
    const {name} = req.body;

    const newResourcesRef = resourcesRef.push();

    newResourcesRef.set({
        name
    }).then(() => {
        res.status(201).json({})
    }).catch((error) => {
        console.error("Error creating resource:", error);
        res.status(500).json({error: error.message});
    });
})

app.post('/book-resource', (req, res) => {
    const {bookedBy, resourceName, date, fromTime, toTime} = req.body;

    // const newBookingRef = bookingRef.push();

    generateAutoId(bookingRef).then((id) => {
        return bookingRef.child(id).set({
            id,
            bookedBy,
            resourceName,
            date,
            fromTime,
            toTime
        });
    }).then(() => {
        res.status(201).json({})
    }).catch((error) => {
        console.error("Error creating resource:", error);
        res.status(500).json({error: error.message});
    });
})

app.get('/bookings', (req, res) => {
    bookingRef.once('value', (snapshot) => {
        const bookings = snapshot.val()
        res.status(200).json(bookings)
    }, (error) => {
        res.status(500).json({error: error.message});
    })
})

//

/**
 * Start the server
 */
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.debug(`Started running backend server on port: ${PORT}`);
});
