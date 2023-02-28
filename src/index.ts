import { Configuration, OpenAIApi } from "openai";
import * as line from '@line/bot-sdk';
import * as dotenv from 'dotenv';
import express from 'express'
import { WebhookEvent } from "@line/bot-sdk";
import firebaseAdmin from 'firebase-admin';

dotenv.config();

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || ''
const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL || '';

const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN || '';
const CHANNEL_SECRET = process.env.CHANNEL_SECRET || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const PORT = process.env.PORT || 8080;

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

firebaseAdmin.initializeApp({
  projectId: FIREBASE_PROJECT_ID,
  databaseURL: FIREBASE_DATABASE_URL,
})

const db = firebaseAdmin.database()
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

async function handleEvent(event: WebhookEvent) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: event.message.text,
  });

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: completion.data.choices[0].text || 'not find answer',
  });
}

app.get('/', (req, res) => {
  const ref = db.ref('saving/ref/log')
  console.log('test')
  const userRef = ref.child('user')
  userRef.set({
    name: 'Alice',
    age: 30
  }).then(() => {
    console.log('Document created successfully');
  }).catch((error) => {
    console.error('Error creating document:', error);
  });
  res.status(200).end('ok');
})
app.listen(PORT, () => {
  console.info(`Service is launched on port: :${PORT}`)
});
