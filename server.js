var express = require( 'express' ),
  http = require( 'http' ),
  config = require( 'dotenv' ).config(),
  app = express(),
  server = http.createServer( app ),
  io = require( 'socket.io' ).listen( server ),
  port = 8080,
  browser_sockets = {},
  controller_sockets = {},
  repl = require( "repl" ),
  ///for Arduino configuration
  SerialPort = require( 'serialport' ),
  defaults = {
    baudRate: 9600
  },
  Board = require( "firmata" ),
  ///for correct display of data from Serial port
  Readline = SerialPort.parsers.Readline;
pixel = require( "node-pixel" );

server.listen( port );


// Serve static files under the /public directory
app.use( "/public", express.static( __dirname + '/public' ) );

// Set up index
app.get( '/', function ( req, res ) {

  res.sendFile( __dirname + '/index.html' );

} );

// Dependancy upon Johnny-Five
var five = require( "johnny-five" );

// Set up references to Arduino Board and LED
var myBoard, myLed;

// Initialise Microcontroller
myBoard = new five.Board();

// After successful initialisation of the board this code block will be run
myBoard.on( "ready", function () {

  // // Instantiate a LED Object (Arduino Uno has a LED attached to Pin 13)
  // myLed = new five.Led( 13 );
  //
  // Add myLed to REPL


  strip = new pixel.Strip( {
    board: this,
    controller: "FIRMATA",
    strips: [ {
      pin: 6,
      length: 4
    }, ], // this is preferred form for definition
    gamma: 2.8, // set to a gamma that works nicely for WS2812
  } );
  // Just like DOM-ready for web developers.
  strip.on( "ready", function () {
    // Set the entire strip to pink.
    strip.color( '#42eef4' );

    // Send instructions to NeoPixel.
    strip.show();
    //strip.off();
  } );

  // Allows for command-line experimentation!
  this.repl.inject( {
    strip: strip
  } );
} );

// Log that the servers running
console.log( "Server running on port: " + port );

// On any connection to the socket
io.sockets.on( 'connection', function ( socket ) {
  console.log( "socket connetion innitiated" );

  // ///ARDUINO SETUP
  //portArduino = new SerialPort("/dev/cu.usbmodem14111", defaults);
  //const portArduino = new SerialPort('/dev/tty-usbserial1');
  // var parser = new Readline();
  // var board = new Board( new SerialPort( "/dev/cu.usbmodem14121", defaults ) );
  // board.on( "ready", () => {
  //   // Arduino is ready to communicate
  //   console.log( "Arduino is ready" );
  // } );
  // When a browser connects, store its socket id
  socket.on( 'browser_connect', function () {

    console.log( "browser connected" );

    // Store the browser socket
    browser_sockets[ socket.id ] = {
      socket: socket,
      controller_id: undefined
    };

    // Notify the browser of a successful connection
    socket.emit( "browser_connected", process.env.DEVICE_IP );


    // portArduino.pipe(parser);
    //parser.on('data', console.log);
    //portArduino.write('ROBOT PLEASE RESPOND\n');

    // portArduino.on("open", function() {
    //   console.log('Serial Port Arduino Opend');
    //
    //
    //   parser.on("data", function(data) {
    //     //	Coerce data into a number
    //     //console.log(data);
    //     //dataDigital = parseInt(data, 8);
    //     //data = +data;
    //     //	If data is worth reading and processing
    //     if (data && data > 1) {
    //       //	Create a new Array() whose length equals data
    //       //	then join to create output visualization
    //       //	Print the data value along with visualization of data
    //       //console.log(data)
    //       socket.emit('arduinoUpdate', data);
    //     }
    //
    //   });
    //
    //
    //
    // });


    //	Create new serialport pointer


    // portArduino.on("error", function(msg) {
    //   console.log("error: " + msg);
    // });
    //
    //
    // repl.start("=>");

  } );

  // When a controller attempts to connect it will send the id of the browser
  // socket it is trying to connect to
  socket.on( 'controller_connect', function ( browser_socket_id ) {


    // If the browser socket, that this controller is attempting to connect to, exists
    if ( browser_sockets[ browser_socket_id ] ) {

      console.log( "Controller connected" );

      // Store the controller socket and its relevant browser socket
      controller_sockets[ socket.id ] = {
        socket: socket,
        browser_id: browser_socket_id
      };

      // Notify the controller of a successful connection
      socket.emit( "controller_connected", true );

      // Set the controller id on the relevant browser socket object
      browser_sockets[ browser_socket_id ].controller_id = socket.id;

      // Notify relevant browser socket that a controller has connected successfully
      browser_sockets[ browser_socket_id ].socket.emit( "controller_connected", true );

      // Forward the changes onto the relative browser socket
      socket.on( 'controller_state_change', function ( data ) {

        if ( browser_sockets[ browser_socket_id ] ) {

          // Notify relevant browser socket of controller state change
          browser_sockets[ browser_socket_id ].socket.emit( "controller_state_change", data )
        }
      } );

    } else {

      console.log( "Controller failed to connect" );

      // Notify the controller of a failed connection
      socket.emit( "controller_connected", false );
    }
  } );


  // When a socket disconnects
  socket.on( 'disconnect', function () {

    // If it's a browser socket
    if ( browser_sockets[ socket.id ] ) {

      console.log( "browser disconnected" );

      // If this browser has a controller connected to it
      if ( controller_sockets[ browser_sockets[ socket.id ].controller_id ] ) {

        // Notify relevant controller socket that the browser has disconnected
        controller_sockets[ browser_sockets[ socket.id ].controller_id ].socket.emit( "controller_connected", false );

        // Remove browser id from the relevant controller socket
        controller_sockets[ browser_sockets[ socket.id ].controller_id ].browser_id = undefined;
      }

      // Delete it
      delete browser_sockets[ socket.id ];
    }

    // If it's a controller socket
    if ( controller_sockets[ socket.id ] ) {

      console.log( "Controller disconnected" );

      // If this controller is connected to a browser socket
      if ( browser_sockets[ controller_sockets[ socket.id ].browser_id ] ) {

        // Notify relevant browser socket that the controller has disconnected
        browser_sockets[ controller_sockets[ socket.id ].browser_id ].socket.emit( "controller_connected", false );

        // Remove controller id from the relevant browser socket
        browser_sockets[ controller_sockets[ socket.id ].browser_id ].controller_id = undefined;
      }

      // Delete it
      delete controller_sockets[ socket.id ];
    }
  } );

} );