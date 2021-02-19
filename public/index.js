const topic = "smith";
const userId = Math.random().toString(36).substr(2, 11);
const EVENT_TYPE = {
  JOIN: 1,
  SIMPLEPEER: 2,
};
let peer = null;

console.log("user:", userId);

// mqtt
mqttClient = new Paho.MQTT.Client("", 9001, userId);
mqttClient.onConnectionLost = (responseObject) => {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:" + responseObject.errorMessage);
  }
};
mqttClient.onMessageArrived = (message) => {
  const parsedMessage = JSON.parse(message.payloadString);
  if (parsedMessage.id !== userId) {
    console.log("receive from mqtt:" + message.payloadString);

    switch (parsedMessage.type) {
      case EVENT_TYPE.JOIN:
        handleJOIN();
        break;
      case EVENT_TYPE.SIMPLEPEER:
        handleSIMPLEPEER(parsedMessage.body);
        break;
    }
  }
};

mqttClient.connect({
  onSuccess: () => {
    console.log("connet to mqtt broker");
    mqttClient.subscribe(topic);

    sendToMqtt(EVENT_TYPE.JOIN, "");
  },
  useSSL: false,
});

function sendToMqtt(type, data) {
  console.log("send to mqtt:" + data);
  const message = new Paho.MQTT.Message(
    JSON.stringify({ id: userId, type, body: data })
  );
  message.destinationName = topic;
  mqttClient.send(message);
}

function handleJOIN() {
  peer = new SimplePeer({ initiator: true });
  peer.on("signal", (data) => {
    sendToMqtt(EVENT_TYPE.SIMPLEPEER, data);
  });
  peer.on("connect", () => {
    console.log("establish datachannel");
    peer.send("hello");
  });
  peer.on("close", () => {
    console.log("close peer");
  });
  peer.on("error", (err) => {
    console.log("err:", err);
  });
}

function handleSIMPLEPEER(signal) {
  if (peer === null) {
    peer = new SimplePeer({ initiator: false });
    peer.on("signal", (data) => {
      sendToMqtt(EVENT_TYPE.SIMPLEPEER, data);
    });
    peer.on("connect", () => {
      console.log("establish datachannel");
    });
    peer.on("data", (data) => {
      console.log("datachannel:", data);
    });
    peer.on("close", () => {
      console.log("close peer");
    });
    peer.on("error", (err) => {
      console.log("err:", err);
    });
  }
  peer.signal(signal);
}
