import { ChatCompletion } from 'openai/resources/index.mjs';
import { ElementHandle } from 'puppeteer';
import Tesseract, { RecognizeResult } from 'tesseract.js';

import { BotUtils } from '../bot/BotUtils.js';
import { MembeanBot } from '../bot/MembeanBot.js';
import { Prompts } from '../bot/Prompts.js';

import { MultipleChoiceQuestion } from './MultipleChoiceQuestion.js';

export class ConstellationQuestion extends MultipleChoiceQuestion {
  public constructor (bot: MembeanBot) {
    super(bot, 'CONSTELLATION');
  }

  protected override async sendAPI (s: string, p: string): Promise<ChatCompletion> {
    const img: ElementHandle<HTMLImageElement> | null = await this.page.waitForSelector('#constellation img');
    const txt: RecognizeResult = await Tesseract.recognize(await BotUtils.getImageElementSrc(img), 'eng');
    return await super.sendAPI(s + `\n\nTEXT:\n"${txt.data.text}"`, Prompts.CONSTELLATION);
  }
}
