import { WebhookEvent } from "@line/bot-sdk";
import weaviate, { WeaviateClient } from 'weaviate-ts-client';

// const WEAVIATE_HOST = process.env.WEAVIATE_HOST || '';

// const weaviateClient: WeaviateClient = weaviate.client({
//   scheme: 'https',
//   host: WEAVIATE_HOST,  // Replace with your endpoint
// });

function main(req, res, next) {
  res.status(200).end();
  try {
    Promise.all(req.body.events.map(handleEvent));
  } catch (err) {
    console.error(err);
  }
}

async function handleEvent(event: WebhookEvent) {
  if (!event.source) {
    // identified as non real person.
    return;
  }
  if (event.type !== 'message') {
    return;
  }
  // @ts-ignore
  const userInput = event.message.text;
  // query past history
  // Identify intention
  // command flow
  // summary and reply

}

function constructPrompt(): string {
  const promps: string[] = [];
  promps.push(`You're shop assistant chatbot and you will help user to narrow down user
  s need with no legal complications.`)
  promps.push(`Goals:
    1. 推薦我商品。
    2. 所有問題請用中文回答。
    3. 幫我釐清我的需求。
  `)
  promps.push(`Constraints:
    1. 每個回答請限制在1000 word之內
    2. If you are unsure how you previously did something or want to recall past events, thinking about similar events will help you remember
    3. 幫我釐清我的需求。
  `)
  promps.push(`Resources:
    1. Internet access for searches and information gathering.
    2. Long term memory management.
  `)
  promps.push(`PERFORMANCe EVALUATION:
    1. Internet access for searches and information gathering.
    2. Long term memory management.
  `)
  return ''
}

export default main;
