import { ChatCompletion } from 'openai/resources/index.mjs';
import { ElementHandle } from 'puppeteer';

import { BotUtils } from '../bot/BotUtils.js';
import { MembeanBot } from '../bot/MembeanBot.js';
import { Prompts } from '../bot/Prompts.js';

import { TypingQuestion } from './TypingQuestion.js';

export class SentenceWordQuestion extends TypingQuestion {
  public constructor (bot: MembeanBot) {
    super(bot, 'SENTENCE_WORD');
  }

  public override async answer (): Promise<void> {
    const tel: ElementHandle<Element> | null = await this.page.waitForSelector(TypingQuestion.CHOICE_SELECTOR);
    let el: ElementHandle<Element> | null = await this.page.waitForSelector('#single-question');
    let s: string = await BotUtils.getElementInnerText(el);
    this.logger.debug(s);
    s += '\n\n';
    el = await this.page.waitForSelector('#word-hint p');
    s += await BotUtils.getElementInnerText(el);
    const response: ChatCompletion = await this.sendAPI(s, Prompts.SENTENCE_WORD);
    const time: number = this.getRandomTime();
    const answer: string = (response.choices[0].message.content || '-1').trim();
    this.logger.debug(`API answer: ${answer}`);
    await BotUtils.sleep(time);
    if (answer !== '-1') {
      await tel?.focus();
      for (const char of (BotUtils.scrambleAnswer(answer, this.bot.getConfig().get('answers.accuracy')) as string)) {
        tel?.type(char);
        await BotUtils.sleep(time / 50);
      }
    } else {
      el = await this.page.waitForSelector('#notsure');
      el?.click();
    }
  }
}
