const mqtt = require("mqtt");
const client = mqtt.connect({
  hostname: "193.122.99.85",
  port: 80,
  protocol: "ws",
});

client.on("connect", () => {
  client.subscribe("presence", (err) => {
    if (!err) {
      client.publish("presence", "Hello mqtt");
    }
  });
});

client.on("message", (topic, message) => {
  // message is Buffer
  console.log(message.toString());
  client.end();
});
