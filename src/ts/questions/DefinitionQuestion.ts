import { ElementHandle } from 'puppeteer';

import { MembeanBot } from '../exports.js';

import { MultipleChoiceQuestion } from './MultipleChoiceQuestion.js';

export class DefinitionQuestion extends MultipleChoiceQuestion {
  public constructor (bot: MembeanBot) {
    super(bot, 'DEFINITION');
  }

  protected override async getCorrectAnswer (): Promise<ElementHandle<Element> | null> {
    return await this.page.waitForSelector(`${MultipleChoiceQuestion.CHOICE_SELECTOR}.answer`);
  }
}
