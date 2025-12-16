import { ChatCompletion } from 'openai/resources/index.mjs';
import { ElementHandle } from 'puppeteer';

import { BotUtils } from '../bot/BotUtils.js';
import { MembeanBot } from '../bot/MembeanBot.js';

import { TypingQuestion } from './TypingQuestion.js';

export class WordSpellQuestion extends TypingQuestion {
  public constructor (bot: MembeanBot) {
    super(bot, 'WORDSPELL');
  }

  public override async answer (): Promise<void> {
    const el: ElementHandle<Element> | null = await this.page.waitForSelector(TypingQuestion.CHOICE_SELECTOR);
    const time: number = this.getRandomTime();
    await BotUtils.sleep(time);
    await el?.focus();
    for (const char of this.bot.getWord()) {
      el?.type(char);
      await BotUtils.sleep(time / 50);
    }
    await this.page.keyboard.press('Enter');
  }

  protected override async sendAPI (s: string, p: string): Promise<ChatCompletion> {
    return await new Promise<ChatCompletion>(() => {});
  }
}
