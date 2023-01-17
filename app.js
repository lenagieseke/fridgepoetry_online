/***********************************************************
 * app.js
 *
 * Author: Lena Gieseke
 * 
 * Date: December 2018
 * Update: January 2021
 * 
 * Purpose: Browser-based representation
 *          of word magnets on a fridge.
 *
 * Usage: 
 * 
 * Notes: SOLUTION
 *
 *********************************************************/ 

// Loading the modules
// TODO 1
// Loading the modules
const express = require('express');

// TODO 2 
// Listen to port 3000
const port = process.env.PORT || 3000;

// The following line, which we used in the
// storytelling app, returns a function that
// can handle express request functions
// needed for routing. In this example
// we use no routes but only one index.html
// and therefor don't really need this line
// (for creating the server below, we could
// also just use express().use().listen())
const app = express();

// For the socketIO constructor, 
// we need an express server instance,
// which is started to listen for 
// connections on the given port:
const server = app
                .use(express.static('public'))
                .listen(port, () => console.log(`Listening on ${port}`));

// TODO 3a
const socketio = require('socket.io');



// TODO 10a
const mongoose = require('mongoose');


// DATABASE //////////////////////////////////////// 

// As we have very little database code, we just
// put it right here. Whether this is good style
// is debatable. I keep the code here and do
// no move it to a different file for a (hopefully)
// better overview.


// TODO 10b
// Insert your connection string
const dbUrl = "mongodb+srv://admin:admin123@cluster2021.hgrys.mongodb.net/fridgepoetry_ws2021?retryWrites=true";

// Connecting
mongoose.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true}) 
    .then(() => console.log('Connection established to', dbUrl))
    .catch(err => console.error('Unable to connect to the mongoDB server. Error:', err.message));

// TODO 11
let MagnetSchema = new mongoose.Schema(
    {
        index: Number,
        x: Number,
        y: Number,
    });
    
    let Magnet = mongoose.model('magnet', MagnetSchema);

// APPLICATION //////////////////////////////////////// 

// TODO 2 


// TODO 3b
// Creating a new communication pipe
// based on the given express server and port
const io = socketio(server);
// The above line is the same as
// const io = require('socket.io')(server);

// Adds a callback function ("listener")
// for the event "connection", which
// the express server emits.
// "on" stands for "addEventListener"
io.on('connection', socket =>
{
    console.log('New client connected');

    // TODO 13
    // Get magnets from database
    // Initialize the database if necessary and
    // if not initialize the client with the database data
    socket.on('clientSetupReady', () =>
    {
        console.log('Client ready');

        Magnet.find()
            .then(docs => 
            {
                if(docs.length == 0)
                {
                    // TODO 14
                    console.log('Init Database');
                    socket.emit('serverAsksForMagnetData');
                }
                else
                {
                    // TODO 17
                    console.log('Init Client');
                    socket.emit('serverSendsDbData', docs);

                }
            })
            .catch(err => console.error(err));
    });

    // TODO 7
    // Receive moving signal from a client
    socket.on('clientMagnetMove', (data) =>
    {
        console.log('Moved:', data);

         // TODO 8
        // Send the movement data to all
        // other clients
        socket.broadcast.emit('serverBroadcastMagnetMove', data);


        // TODO 16
        // Update the position in the database
        Magnet.findOne({index:Number(data.index)})
                .then(docs =>
                {
                    if(docs !== null) // update
                    {
                        docs.x = data.x;
                        docs.y = data.y;
                        docs.save();
                    }
                    else // initialize
                    {
                        let tmpMagnet = new Magnet(data);
                        tmpMagnet.save()
                                    // .then(doc => console.log('New element saved', doc))
                                    .catch(err => console.error(err))
                    }
                }) 
                .catch(err => console.error(err));
    });

});
