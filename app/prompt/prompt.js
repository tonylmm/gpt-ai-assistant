import { encode } from 'gpt-3-encoder';
import config from '../../config/index.js';
import { t } from '../../locales/index.js';
import { ROLE_AI, ROLE_HUMAN, ROLE_SYSTEM } from '../../services/openai.js';
import { addMark } from '../../utils/index.js';
import Message from './message.js';

const MAX_MESSAGES = config.APP_MAX_PROMPT_MESSAGES + 3;
const MAX_TOKENS = config.APP_MAX_PROMPT_TOKENS;

class Prompt {
  messages = [];

  constructor() {
    const translationPrompt = `
    你是一位專業的翻譯專家，專門處理主恢復中的召會相關翻譯，熟悉該領域的專有名詞、用詞和背景。你的任務是根據資料庫中的資料，準確地在中英文之間進行翻譯。
    #### 翻譯規則：
    1. **中文到英文**：  
    - 如果用戶輸入中文，請將內容翻譯成流暢且準確的英文，並確保專有名詞和語境正確。
    2. **英文到中文**：  
    - 如果用戶輸入英文，請將內容翻譯成流暢且準確的中文，並確保專有名詞和語境正確。
    3. **專有名詞處理**：  
    - 對於主恢復中的專有名詞（例如：神聖分賜、基督身體、召會生活等），請基於主恢復的用法進行翻譯。
    4. **語境推斷**：  
    - 如果對內容有任何疑問，請根據主恢復的語境進行推斷並翻譯，確保符合該領域的用語習慣。
    #### 注意事項：
    - 始終保持翻譯的準確性和流暢性。
    - 對於專有用詞，請以主恢復中的標準翻譯為準。
    - 如果需要，可以簡要調整語序以使翻譯更自然，但不可改變原意。
    `;

    this
      .write(ROLE_SYSTEM, translationPrompt || config.APP_INIT_PROMPT || t('__COMPLETION_DEFAULT_SYSTEM_PROMPT'))
      .write(ROLE_HUMAN, `${t('__COMPLETION_DEFAULT_HUMAN_PROMPT')(config.HUMAN_NAME)}${config.HUMAN_INIT_PROMPT}`)
      .write(ROLE_AI, `${t('__COMPLETION_DEFAULT_AI_PROMPT')(config.BOT_NAME)}${config.BOT_INIT_PROMPT}`);
  }

  /**
  * @returns {Message}
  */
  get lastMessage() {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
  }

  get tokenCount() {
    const encoded = encode(this.toString());
    return encoded.length;
  }

  erase() {
    if (this.messages.length > 0) {
      this.messages.pop();
    }
    return this;
  }

  /**
  * @param {string} role
  * @param {string} content
  */
  write(role, content = '') {
    if (this.messages.length >= MAX_MESSAGES || this.tokenCount >= MAX_TOKENS) {
      this.messages.splice(3, 1);
    }
    this.messages.push(new Message({ role, content: addMark(content) }));
    return this;
  }

  /**
  * @param {string} role
  * @param {string} content
  */
  writeImage(role, content = '') {
    const imageContent = [
      {
        type: 'text',
        text: t('__COMPLETION_VISION'),
      },
      {
        type: 'image_url',
        image_url: {
          url: content,
        },
      },
    ];
    this.messages.push(new Message({ role, content: imageContent }));
    return this;
  }

  /**
  * @param {string} content
  */
  patch(content) {
    this.messages[this.messages.length - 1].content += content;
  }

  toString() {
    return this.messages.map((sentence) => sentence.toString()).join('');
  }
}

export default Prompt;
