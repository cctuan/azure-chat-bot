import { Configuration, OpenAIApi } from "openai";

class AIBridge {
  client;
  constructor(apiKey = '') {
    const configuration = new Configuration({
      apiKey,
    });
    this.client = new OpenAIApi(configuration);
  }

  _startTemplate() {
    return `你將扮演出題者，回應我question，我會嘗試猜出answer。你說明question與answer。以下例子以json形式:
    {"question":"有一位船長喝了一碗湯，感覺味道有點奇怪，就問店家這是什麼湯？店家告訴他：「這是用海龜肉做的湯」，船長便沉思了一下，然後痛哭了起來，接著就自殺了。請問為什麼呢？","answer":"船長以前出海的時候，遇上暴風雨，船故障在海上漂了很久，而且大家都沒東西吃，有些船員甚至因為暴風雨離世了，於是就有船員為了讓船長活下去，將已經死亡船員的肉，煮成湯給船長喝，騙他是海龜肉，船長就活下來了。多年後船長在店家吃到真正的海龜肉，終於明白當時的事情，傷心之下選擇自殺."}
        請出一個新的json, 裡面的question與answer符合以下條件
    1. question應具備真實、懸疑、驚悚、恐怖且令人出乎意料
    2. question與answer都不該含有任何神秘、鬼怪、靈異、虛構的元素
    3. 從question應難以推斷answer的內容。
    4. answer應簡短
    新的json為:`
  }

  _respondQuestion({
    question = '',
    answer = '',
    clientQuestion = '',
  }) {
    return `你將回應我question，我會嘗試猜出answer。
    question:${question}
    ,answer:${answer}
    如果我的問題已80%以上符合答案描述，請告訴我[你猜對了] 並告訴我完整故事，如果我的問題有79%以下符合答案描述，請根據answer回答[是]或[不是] 。
    我的問題: ${clientQuestion}?
    答案是:`
  }

  async start(): Promise<[string, string]> {
    try {
      const response = await this._askPrompt(this._startTemplate());
      const {question, answer} = JSON.parse(response || '{}')
      return [question, answer]
    } catch (e) {
      return ['', '']
    }
  }

  async reply({
    question = '',
    answer = '',
    clientQuestion = '',
  }): Promise<string> {
    const response = await this._askPrompt(this._respondQuestion({
      question,
      answer,
      clientQuestion,
    }));
    return response || ''
  }

  async _askPrompt(text = '') {
    const completion = await this.client.createCompletion({
      model: "gpt-3.5-turbo",
      prompt: text,
      max_tokens: 1040,
      temperature: 0.7,
      top_p: 1,
      best_of: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });
    return completion.data.choices[0].text
  }
}
export default AIBridge;
