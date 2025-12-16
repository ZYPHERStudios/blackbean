import { ChatCompletion } from 'openai/resources/index.js';
import { Page } from 'puppeteer';

import { BotConfig } from '../bot/BotConfig.js';
import { BotUtils } from '../bot/BotUtils.js';
import { Logger } from '../bot/Logger.js';
import { MembeanBot } from '../bot/MembeanBot.js';

export abstract class MembeanQuestion {
  private readonly type: string;

  protected readonly bot: MembeanBot;
  protected readonly logger: Logger;
  protected readonly page: Page;

  public constructor (bot: MembeanBot, type: string) {
    this.bot = bot;
    this.logger = bot.getLogger();
    this.page = bot.getPage();
    this.type = type;
  }

  public getType (): string {
    return this.type;
  }

  protected getRandomTime (): number {
    const config: BotConfig = this.bot.getConfig();
    return BotUtils.rand(config.get('answers.delay_min'), config.get('answers.delay_max'));
  }

  protected async sendAPI (s: string, p: string): Promise<ChatCompletion> {
    return await this.bot.getOpenAI().chat.completions.create({
      model: this.bot.getConfig().get('api.model'),
      messages: [{ role: 'user', content: `${p}\n\n${s}` }]
    });
  }

  public abstract answer (): Promise<void>;
}

export class QuestionError extends Error {
  constructor (message: string) {
    super(message);
  }
}
