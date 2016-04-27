var awsIot = require('aws-iot-device-sdk');
var Gpio = require('chip-gpio').Gpio;
var deviceName = "violin-chip";
var deviceCredentials = {
  keyPath: '/home/chip/.aws-device/private.pem.key',
  certPath: '/home/chip/.aws-device/certificate.pem.crt',
  caPath: '/home/chip/.aws-device/root-CA.pem',
  clientId: deviceName,
  region: 'ap-southeast-1',
  reconnectPeriod: 1500
};
var button1 = new Gpio(6, 'in', 'both', {
  debounceTimeout: 500
});

var button2 = new Gpio(5, 'in', 'both', {
  debounceTimeout: 500
});

var button3 = new Gpio(4, 'in', 'both', {
  debounceTimeout: 500
});

var device = awsIot.device(deviceCredentials);

device.subscribe('mozart');

function disarm() {
  device.publish('mozart', JSON.stringify({ event: 'disarmed', device: deviceName }));
  updateState({ "state": "disarmed" });
}

function boom() {
  device.publish('mozart', JSON.stringify({ event: 'boom', device: deviceName }));
  updateState({ "state": "boom" });
}

function arm() {
  device.publish('mozart', JSON.stringify({ event: 'armed', device: deviceName }));
  updateState({ "state": "armed" });
}

button1.watch(function(err, value) {
  if (err) {
    throw err;
  }
  console.log('Button1 pressed - Disarmed');
  disarm();
});

button2.watch(function(err, value) {
  if (err) {
    throw err;
  }
  console.log('Button2 pressed - Boom!');
  boom();
});

button3.watch(function(err, value) {
  if (err) {
    throw err;
  }
  console.log('Button3 pressed - no nothing');
});

device.on('message', function(topic, payload) {
    console.log('Message Received');
    console.log('Topic: ' + topic);
    console.log('Payload: ' + payload.toString());

    payload = JSON.parse(payload);
    switch (payload.event) {
      case "arm":
        // TODO: change state to armed
        console.log('Armed!');
        arm();
        break;
      default:
        console.log("Unhandled event: " + payload.event);
    }
});

var thingShadows = awsIot.thingShadow(deviceCredentials);

thingShadows.on('connect', function() {
  console.log("Shadow Connected!");
  thingShadows.register(deviceName);
});

function updateState(state) {
  var clientTokenUpdate = thingShadows.update(deviceName, { "state": { "desired": state } });
  if (clientTokenUpdate === null) {
    console.log('update shadow failed, operation still in progress');
  }
}

thingShadows.on('status', function(thingName, stat, clientToken, stateObject) {
  console.log('received '+stat+' on '+thingName+': '+ JSON.stringify(stateObject));
});

thingShadows.on('delta', function(thingName, stateObject) {
  console.log('received delta on '+thingName+': '+ JSON.stringify(stateObject));
});

thingShadows.on('timeout', function(thingName, clientToken) {
  console.log('received timeout on '+thingName+' with token: '+ clientToken);
});

function exit() {
  button1.unexport();
  button2.unexport();
  button3.unexport();
  process.exit();
}

process.on('SIGINT', exit);
