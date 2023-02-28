
import firebaseAdmin from 'firebase-admin';

class ConversationModel {
  db;
  conversationRef;
  constructor({
    projectId = '',
    databaseURL = '',
  }) {
    firebaseAdmin.initializeApp({
      projectId,
      databaseURL,
    })
    this.db = firebaseAdmin.database()
    this.conversationRef = this.db.ref('room')
  }

  save({
    roomId = '',
    question = '',
    answer = '',
    datetime = Date.now(),
  }) {
    this.conversationRef.child(roomId).set({
      question,
      answer,
      datetime: Date.now()
    });
  }

  saveInHistory({
    roomId = '',
    question = ''
  }) {
    this.conversationRef.child(`${roomId}/history`).push().set({
      question,
      datetime: Date.now(),
    })
  }

  async query({roomId = ''}): Promise<{question: string, answer: string}> {
    return new Promise((resolve, reject) => {
      this.db.ref(`room/${roomId}`).on('value', snapshot => {
        resolve(snapshot.val())
      }, errorObject => {
        reject(errorObject)
      })
    })
  }
}

export default ConversationModel;
