const topic = "smith";
const myId = Math.random().toString(36).substr(2, 11);
const EVENT_TYPE = {
  JOIN: 1,
  LEAVE: 2,
  SIMPLEPEER: 3,
};
let peers = {};

console.log("myId:", myId);

// mqtt
mqttClient = new Paho.MQTT.Client("", 9001, myId);
mqttClient.onConnectionLost = (responseObject) => {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:" + responseObject.errorMessage);
  }
};
mqttClient.onMessageArrived = (message) => {
  const parsedMessage = JSON.parse(message.payloadString);
  if (parsedMessage.id !== myId) {
    console.log("receive from mqtt:" + message.payloadString);

    switch (parsedMessage.type) {
      case EVENT_TYPE.JOIN:
        handleNewPeer(parsedMessage.id);
        break;
      case EVENT_TYPE.LEAVE:
        handleRemovePeer(parsedMessage.id);
        break;
      case EVENT_TYPE.SIMPLEPEER:
        handleSimplePeer(parsedMessage.id, parsedMessage.body);
        break;
    }
  }
};

const lwt = new Paho.MQTT.Message(
  JSON.stringify({ id: myId, type: EVENT_TYPE.LEAVE, body: "" })
);
lwt.destinationName = topic;
lwt.qos = 0;
lwt.retained = false;

mqttClient.connect({
  onSuccess: () => {
    console.log("connet to mqtt broker");
    mqttClient.subscribe(topic);
    mqttClient.subscribe(topic + "/whisper/" + myId);

    sendToMqtt(EVENT_TYPE.JOIN, "join");
  },
  useSSL: false,
  willMessage: lwt,
});

function sendToMqtt(type, data, peerId) {
  console.log("send to mqtt:" + data);
  const message = new Paho.MQTT.Message(
    JSON.stringify({ id: myId, type, body: data })
  );

  const dst = peerId ? topic + "/whisper/" + peerId : topic;
  console.log(dst);
  message.destinationName = dst;
  mqttClient.send(message);
}

function handleNewPeer(peerId) {
  const peer = createPeerFactory(peerId, true);
}

function handleRemovePeer(peerId) {
  console.log("leave id:", peerId);

  let peer = getPeerById(peerId);
  if (!peer) {
    return;
  }

  peer.destroy();
  delete peers[peerId];
}

function handleSimplePeer(peerId, signal) {
  let peer = getPeerById(peerId);
  if (!peer) {
    peer = createPeerFactory(peerId, false);
  }
  peer.signal(signal);
}

function getPeerById(peerId) {
  return peers[peerId];
}

function createPeerFactory(peerId, initiator) {
  console.log("create new peer:", peerId);
  const peer = new SimplePeer({ initiator });
  peer.on("signal", (data) => {
    sendToMqtt(EVENT_TYPE.SIMPLEPEER, data, peerId);
  });
  peer.on("connect", () => {
    console.log("establish datachannel");
  });
  peer.on("data", (data) => {
    console.log("datachannel:", data);
    addMessage(data);
  });
  peer.on("close", () => {
    console.log("close peer. id:", peerId);
  });
  peer.on("error", (err) => {
    console.log("err:", err);
  });

  peers[peerId] = peer;

  return peer;
}

function sendMessage() {
  const input = document.querySelector("input");
  const message = input.value;

  Object.values(peers).forEach((peer) => {
    peer.send(message);
  });

  input.value = "";
}

function addMessage(message) {
  const textarea = document.querySelector("textarea");
  textarea.value += message + "\n";
}
