const { connectToRabbitMQ } = require("./rabbitmq");

async function consumeFromQueue(queueName) {
  const channel = await connectToRabbitMQ();
  await channel.assertQueue(queueName, { durable: false });
  console.log(`Waiting for messages from ${queueName}...`);

  channel.consume(
    queueName,
    (msg) => {
      console.log(
        `Received message from ${queueName}:`,
        JSON.parse(msg.content.toString())
      );
      // Add your authentication logic here
    },
    { noAck: true }
  );
}

consumeFromQueue("main_queue");
