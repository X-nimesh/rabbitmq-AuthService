const amqp = require("amqplib");

async function connectToRabbitMQ() {
  const connection = await amqp.connect("amqp://localhost");
  return connection.createChannel();
}

module.exports = { connectToRabbitMQ };
