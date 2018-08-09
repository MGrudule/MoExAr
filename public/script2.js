var io = io.connect();
var dataDisplayed = true;
var animationPaused = false;
var controller_state = {};
// var browser_connected = function(ip) {
//   var url = "http://" + ip + ":8080?id=" + io.id;
//   var qr_code = new QRCode("qr");
//   document.body.innerHTML += url;
//   //qr_code.makeCode(url);
//   io.removeListener('browser_connected', browser_connected);
// };


var io = io.connect();

io.on('connect', function() {
  io.emit('browser_connect');
});

var browser_connected = function(ip) {
  var url = "http://" + ip + ":8080?id=" + io.id;
  var qr_code = new QRCode("qr");
  document.body.innerHTML += url;
  qr_code.makeCode(url);
  io.removeListener('browser_connected', browser_connected);
};
// var browser_connected = function() {
//   var url = "http://x.x.x.x:8080?id=" + io.id;
//   document.body.innerHTML += url;
//   io.removeListener('browser_connected', browser_connected);
// };
//
io.on('browser_connected', browser_connected);