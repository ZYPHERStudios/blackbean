import { ChatCompletion } from 'openai/resources/index.mjs';
import { ElementHandle } from 'puppeteer';

import { BotUtils } from '../bot/BotUtils.js';
import { MembeanBot } from '../bot/MembeanBot.js';
import { Prompts } from '../bot/Prompts.js';

import { MembeanQuestion } from './MembeanQuestion.js';

export class MultipleChoiceQuestion extends MembeanQuestion {
  protected static readonly CHOICE_SELECTOR: string = '#choice-section .choice';

  public constructor (bot: MembeanBot, type: string = 'MULTIPLE_CHOICE') {
    super(bot, type);
  }

  public override async answer (): Promise<void> {
    const correct: ElementHandle<Element> | null = await this.getCorrectAnswer();
    let el: ElementHandle<Element> | null = await this.page.waitForSelector('.question');
    let s: string = await BotUtils.getElementInnerText(el);
    if (correct === null) this.logger.debug(s);
    s += '\n';
    const choices: Array<ElementHandle<Element>> = await this.page.$$(MultipleChoiceQuestion.CHOICE_SELECTOR);
    let response: ChatCompletion;
    let answer: number = -1;
    if (correct === null) {
      for (const choice of choices) {
        if ((await BotUtils.getElementId(choice)).toLowerCase() === 'notsure') continue;
        const answer: string = await BotUtils.getElementInnerText(choice);
        const index: number = Number(await BotUtils.getElementDatasetValue(choice, 'value')) + 1;
        const key: string = `A${index}: ${answer}`;
        this.logger.debug(key);
        s += `\n${key}`;
      }
      response = await this.sendAPI(s, Prompts.MULTIPLE_CHOICE);
      answer = Number(response.choices[0].message.content);
      this.logger.debug(`API answer: ${answer}`);
    }
    await BotUtils.sleep(this.getRandomTime());
    if (correct === null) {
      if (answer > 0) el = await this.page.waitForSelector(`${MultipleChoiceQuestion.CHOICE_SELECTOR}[data-value="${BotUtils.scrambleAnswer(answer - 1, this.bot.getConfig().get('answers.accuracy'))}"]`);
      else el = await this.page.waitForSelector(`${MultipleChoiceQuestion.CHOICE_SELECTOR}#notsure`);
      await el?.click();
    } else {
      await correct.click();
      el = await this.page.waitForSelector('#next-btn');
      await el?.click();
    }
  }

  protected async getCorrectAnswer (): Promise<ElementHandle<Element> | null> {
    return null;
  }
}
