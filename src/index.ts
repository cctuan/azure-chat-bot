import { Configuration, OpenAIApi } from "openai";
import * as line from '@line/bot-sdk';
import * as dotenv from 'dotenv';
import express from 'express'
import { WebhookEvent } from "@line/bot-sdk";
import ConversationModel from "./conversationModel";
import AIBridge from './aiBridge';

dotenv.config();

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || ''
const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL || '';

const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN || '';
const CHANNEL_SECRET = process.env.CHANNEL_SECRET || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const PORT = process.env.PORT || 8080;

const aiBridge = new AIBridge(OPENAI_API_KEY)
const conversationModel = new ConversationModel({
  projectId: FIREBASE_PROJECT_ID,
  databaseURL: FIREBASE_DATABASE_URL,
})

const config = {
  channelAccessToken: CHANNEL_ACCESS_TOKEN,
  channelSecret: CHANNEL_SECRET,
};

const client = new line.Client(config);
line.middleware(config);

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
  res.status(200).end();
  Promise.all(req.body.events.map(handleEvent));
});

async function handlePostBackEvent(event: WebhookEvent) {
  if (event.type !== 'postback') {
    return Promise.resolve(null)
  }
  // @ts-ignore
  const rid = event.source.groupId || event.source.roomId || event.source.userId
  const postback = event.postback
  switch (postback.data) {
    case 'start':
      const [question, answer] = await aiBridge.start();
      conversationModel.save({
        // @ts-ignore
        roomId: event.source.groupId || event.source.roomId || event.source.userId,
        question,
        answer
      })

      client.replyMessage(event.replyToken, {
        type: 'text',
        text: question,
        quickReply: {
          items: [{
            type: "action",
            action: {
              type: "postback",
              label: "重新開始",
              displayText: "重新開始",
              data: "start"
            }
          },{
            type: "action",
            action: {
              type: "postback",
              label: "放棄",
              displayText: "放棄",
              data: "end"
            }
          }]
        }
      });
      return
    case "end":
      try {
        const res = await conversationModel.query({roomId: rid})
        client.replyMessage(event.replyToken, {
          type: 'text',
          text: `全部答案如下 - ${res.answer}`,
          quickReply: {
            items: [{
              type: "action",
              action: {
                type: "postback",
                label: "重新開始",
                displayText: "重新開始",
                data: "start"
              }
            }]
          }
        });
      } catch (e) {
        client.replyMessage(event.replyToken, {
          type: 'text',
          text: `目前沒有系統記錄`,
          quickReply: {
            items: [{
              type: "action",
              action: {
                type: "postback",
                label: "重新開始",
                displayText: "重新開始",
                data: "start"
              }
            },{
              type: "action",
              action: {
                type: "postback",
                label: "放棄",
                displayText: "放棄",
                data: "end"
              }
            }]
          }
        });
      }
      return
    default:
      return Promise.resolve(null)
  }
}

async function handleJoinEvent(event: WebhookEvent) {
  if (event.type !== 'join') {
    return Promise.resolve(null)
  }


  client.replyMessage(event.replyToken, {
    type: 'text',
    text: '您好，可以透過開始遊戲',
    // @ts-ignore
    quickReply: {
      items: [{
        type: "action",
        action: {
          type: "postback",
          label: "開始",
          displayText: "開始",
          data: "start"
        }
      }]
    }
  });
  return
}

async function handleEvent(event: WebhookEvent) {
  if (event.type === 'join') {
    return handleJoinEvent(event)
  }
  if (event.type === 'postback') {
    return handlePostBackEvent(event)
  }

  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  // @ts-ignore
  const rid = event.source.groupId || event.source.roomId || event.source.userId;

  const res = await conversationModel.query({roomId: rid})
  if (!res) {
    console.error('Could not find conversation');
  }

  const answer = await aiBridge.reply({
    question: res.question,
    answer: res.answer,
    clientQuestion: event.message.text
  })

  try {
    client.replyMessage(event.replyToken, {
      type: 'text',
      text: answer,
      quickReply: {
        items: [{
          type: "action",
          action: {
            type: "postback",
            label: "重新開始",
            displayText: "重新開始",
            data: "start"
          }
        },{
          type: "action",
          action: {
            type: "postback",
            label: "放棄",
            displayText: "放棄",
            data: "end"
          }
        }]
      }
    });
  } catch (e) {
    console.log(e)
  }
}

app.get('/', (req, res) => {
  res.status(200).end('ok');
})
app.listen(PORT, () => {
  console.info(`Service is launched on port: :${PORT}`)
});
