import { MembeanBot } from '../bot/MembeanBot.js';

import { MembeanQuestion } from './MembeanQuestion.js';

export abstract class TypingQuestion extends MembeanQuestion {
  protected static readonly CHOICE_SELECTOR: string = 'input#choice';

  public constructor (bot: MembeanBot, type: string) {
    super(bot, type);
  }
}
