var io = io.connect();
var dataDisplayed = true;
var animationPaused = false;
var showQr = false;
var controller_state = {};

//On new browser window
browser_connected = function ( ip ) {
  var url = "http://" + ip + ":8080?id=" + io.id;
  var qr_code = new QRCode( "qr" );
  qr_code.makeCode( url );
  io.removeListener( 'browser_connected', browser_connected );
};


if ( window.location.href.indexOf( '?id=' ) > 0 ) {

  io.emit( 'controller_connect', window.location.href.split( '?id=' )[ 1 ] );

} else {

  io.on( 'connect', function () {

    io.emit( 'browser_connect' );
    io.on( 'browser_connected', browser_connected );

    showQr = true;
    qrCodeImage();




    // io.on('arduinoUpdate', function(data) {
    //
    //   document.getElementById("arduino").innerHTML = data;
    //
    //   if (50 > data / 2) {
    //     document.getElementById("main").style.transform = "translateY(-" + data / 2 + "%)";
    //   } else {
    //     document.getElementById("main").style.transform = "translateY(-50%)";
    //   }
    // });

  } );

}
io.on( 'controller_state_change', function ( data ) {

  document.getElementById( "arduino" ).innerHTML = data.beta;

  if ( data.gamma ) {
    console.log( data.beta + " " + data.gamma )
    document.getElementById( "phone" ).style.transform = "translate(" + data.gamma + "%, " + data.beta + "%)";
  } else {
    document.getElementById( "phone" ).style.transform = "translateY(-50%)";
  }
} );


io.on( 'controller_connected', function ( connected ) {
  console.log( "we have a call" );

  if ( connected ) {
    // Successful connection
    console.log( "Connected!" );
    qrCodeImage( "none" );

    var controller_state = {

        alpha: 0,
        gamma: 0
      },
      emit_updates = function () {
        io.emit( 'controller_state_change', controller_state );

      }
    touchstart = function ( e ) {
        e.preventDefault();
        controller_state.accelerate = true;
        emit_updates();
      },
      touchend = function ( e ) {
        e.preventDefault();
        controller_state.accelerate = false;
        emit_updates();
      },
      devicemotion = function ( e ) {
        controller_state.steer = e.accelerationIncludingGravity.y / 100;
        //controller_state.alpha = e.DeviceRotationRate.alpha;
        emit_updates();
      }
    deviceorientation = function ( e ) {
      //controller_state.steer = e.accelerationIncludingGravity.y / 100;
      controller_state.beta = e.beta.toFixed();
      controller_state.gamma = e.gamma.toFixed();
      emit_updates();
    }
    // document.body.addEventListener('touchstart', touchstart, false); // iOS & Android
    // document.body.addEventListener('MSPointerDown', touchstart, false); // Windows Phone
    // document.body.addEventListener('touchend', touchend, false); // iOS & Android
    // document.body.addEventListener('MSPointerUp', touchend, false); // Windows Phone
    //window.addEventListener( 'devicemotion', devicemotion );
    window.addEventListener( 'deviceorientation', deviceorientation, true );


    //window.addEventListener("devicemotion", handleMotionEvent, true);
  } else {
    // Failed connection
    alert( "Not connected!" );
    qrCodeImage( "block" );

    controller_state = {};
  }



} );





///Function for url to QR code
function qrCodeImage( state ) {
  console.log( "Show QR code initiated" );
  var qr = document.getElementById( "qr" ),
    qrExists = qr !== null;

  if ( showQr && !qrExists ) {
    console.log( "Create new QR" );
    var qr = document.createElement( 'div' );
    qr.id = "qr";
    document.body.appendChild( qr );

  } else if ( showQr && state ) {
    console.log( "Show/hide existing " + qr );

    qr.style.display = state;

  } else {
    console.log( "Show QR code set to false" );
  }
}