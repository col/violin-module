var _ = require("lodash");
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

var CONNECTED = true;
var CUT = false;
var LED_ON = 0;
var LED_OFF = 1;

var device = awsIot.device(deviceCredentials);

device.subscribe('mozart');


var greenLED = new Gpio(6, 'out');
var redLED = new Gpio(7, 'out');


var wires = [];
var initialState = [];
var wireStatus = [];
var correctAnswer;

watchWires();

function disarm() {
  console.log('Disarmed!');
  greenLED.write(LED_ON);
  redLED.write(LED_OFF);
  device.publish('mozart', JSON.stringify({ event: 'disarmed', device: deviceName }));
  // updateState({ "state": "disarmed" });
}

function boom() {
  console.log('Boom!');
  greenLED.write(LED_OFF);
  redLED.write(LED_ON);
  device.publish('mozart', JSON.stringify({ event: 'boom', device: deviceName }));
  // updateState({ "state": "boom" });
}

function arm() {
  console.log('Armed!');
  greenLED.write(LED_OFF);
  redLED.write(LED_ON);
  device.publish('mozart', JSON.stringify({ event: 'armed', device: deviceName, hint: "Doodl" }));
  // updateState({ "state": "armed" });
}

function reset() {
  console.log('Reset');
  greenLED.write(LED_OFF);
  redLED.write(LED_OFF);
  wires = [];
  initialState = [];
  wireStatus = [];
}

function config(payload) {
  if(payload.device != deviceName){
    return;
  }
  reset();
  console.log('Config');
  var numberOfWires = payload.data.length;

  for(var i=1;i<= numberOfWires;i++){
    wires.push(new Gpio(i, 'in', 'both', { debounceTimeout: 500 }));
    initialState.push(CONNECTED);
    wireStatus.push(CONNECTED);
  };

  correctAnswer = payload.data;
}

reset();

function watchWires() {
  for (var i = 0; i < 5; i++) {
    (function(index){
      wires[index].watch(function(err, value) {
        if (err) throw err;
        console.log("Something happened on wire", index, value);
        if (value === 1) wireStatus[index] = CUT;

        console.log(_.map(wireStatus, function(status) { return status === CONNECTED ? "CONNECTED" : "CUT" }));
        if (_.isEqual(wireStatus, correctAnswer)) disarm();
        else if (!_.isEqual(wireStatus, initialState)) boom();
      });
    })(i);
  }
}

device.on('message', function(topic, payload) {
    console.log('Message Received - Topic: ' + topic + ' Payload: ' + payload.toString());

    payload = JSON.parse(payload);
    switch (payload.event) {
      case "arm":
        arm();
        break;
      case "reset":
        reset();
        break;
      case "config":
        config(payload);
        break;  
    }
});

// var thingShadows = awsIot.thingShadow(deviceCredentials);

// thingShadows.on('connect', function() {
//   console.log("Shadow Connected!");
//   thingShadows.register(deviceName);
// });

// function updateState(state) {
//   var clientTokenUpdate = thingShadows.update(deviceName, { "state": { "desired": state } });
//   if (clientTokenUpdate === null) {
//     console.log('update shadow failed, operation still in progress');
//   }
// }

// thingShadows.on('status', function(thingName, stat, clientToken, stateObject) {
//   console.log('received '+stat+' on '+thingName+': '+ JSON.stringify(stateObject));
// });

// thingShadows.on('delta', function(thingName, stateObject) {
//   console.log('received delta on '+thingName+': '+ JSON.stringify(stateObject));
// });

// thingShadows.on('timeout', function(thingName, clientToken) {
//   console.log('received timeout on '+thingName+' with token: '+ clientToken);
// });

function exit() {
  for (var i = 0; i < 5; i++) {
    wires[i].unexport();
  }
  process.exit();
}

process.on('SIGINT', exit);
