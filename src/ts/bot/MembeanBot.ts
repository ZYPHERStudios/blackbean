import crypto from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';

import cssEscape from 'css.escape';
import OpenAI from 'openai';
import type { BoundingBox, Browser, ElementHandle, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import pluginStealth from 'puppeteer-extra-plugin-stealth';
import pluginUserPreferences from 'puppeteer-extra-plugin-user-preferences';

import { ConstellationQuestion } from '../questions/ConstellationQuestion.js';
import { DefinitionQuestion } from '../questions/DefinitionQuestion.js';
import { FinishWordQuestion } from '../questions/FinishWordQuestion.js';
import { MembeanQuestion } from '../questions/MembeanQuestion.js';
import { MultipleChoiceQuestion } from '../questions/MultipleChoiceQuestion.js';
import { SentenceWordQuestion } from '../questions/SentenceWordQuestion.js';
import { WordSpellQuestion } from '../questions/WordSpellQuestion.js';

import { BotConfig } from './BotConfig.js';
import { BotUtils } from './BotUtils.js';
import { Logger } from './Logger.js';

const puppeteer = puppeteerExtra as any as import('puppeteer-extra').PuppeteerExtra;

puppeteer.use(pluginStealth());
puppeteer.use(pluginUserPreferences({ userPrefs: { profile: { allow_chrome_signin: false } } }));

export class MembeanBot {
  private readonly config: BotConfig;
  private readonly logger: Logger;
  private readonly openai: OpenAI;

  private initialized: boolean;
  private loggedIn: boolean;
  private running: boolean;
  private readonly debugPath: string;
  private readonly hash: string;
  private word: string;
  private browser: Browser;
  private page: Page;

  constructor (config?: object) {
    this.config = new BotConfig(config);
    this.logger = new Logger(this.config);
    this.openai = new OpenAI({
      baseURL: this.config.get('api.base_url'),
      apiKey: this.config.get('api.api_key')
    });
    this.hash = crypto.createHash('sha256').update(`${this.config.get('membean_auth.auth_method')}:${this.config.get('membean_auth.email')}:${this.config.get('membean_auth.password')}`).digest('hex');
    this.debugPath = `./debug/${this.hash}`;
  }

  public async init (): Promise<void> {
    try {
      if (this.initialized) throw new BotAlreadyInitializedError();
      this.logger.debug('Initializing bot...');
      const models = await this.openai.models.list();
      this.logger.debug(`Available Models: ${models.data.map(m => m.id).join(', ')}`);
      this.browser = await puppeteer.launch({
        headless: this.config.get('bot.headless'),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-sync',
          '--disable-features=ChromeWhatsNewUI,ChromeTips',
          '--disable-background-networking',
          '--no-service-autorun'
        ]
      });
      const pages = await this.browser.pages();
      if (pages.length > 0) this.page = pages[0];
      else this.page = await this.browser.newPage();
      await this.page.setBypassCSP(true);
      this.initialized = true;
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36');
      await this.page.setViewport({ width: 1366, height: 768 });
      this.logger.debug('Initialized bot.');
    } catch (e: any) {
      if (e instanceof Error) e = e.stack;
      this.logger.error(e);
    }
  }

  public async login (): Promise<void> {
    try {
      if (!this.initialized) throw new BotNotInitializedError();
      if (this.loggedIn) throw new BotAlreadyLoggedInError();
      this.logger.debug('Logging in...');
      const method: string = this.config.get('membean_auth.auth_method').toLowerCase();
      let url: string;
      switch (method) {
        case 'google': {
          url = 'https://membean.com/google_oauth_signin';
          break;
        }
        default: {
          url = 'https://membean.com/login';
          break;
        }
      }
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      let el: ElementHandle<Element> | null;
      switch (method) {
        case 'google': {
          el = await this.page.waitForSelector('input[type=email]');
          await el?.focus();
          this.logger.debug('Typing email...');
          await el?.type(this.config.get('membean_auth.email'));
          this.logger.debug('Typed email.');
          await this.debugScreenshot('login_email');
          el = await this.page.waitForSelector('#identifierNext');
          await el?.click();
          await this.page.waitForNetworkIdle();
          const selector: string = '#captchaimg';
          if (await BotUtils.elExists(this.page, selector)) {
            el = await this.page.waitForSelector(selector);
            let box: BoundingBox | null | undefined = await el?.boundingBox();
            if (box !== undefined && box !== null && box.width > 0 && box.height > 0) {
              await this.debugScreenshot('login_captcha', el);
              this.logger.info('Waiting for CAPTCHA...');
              while (!this.loggedIn) {
                BotUtils.sleep(100);
                box = await el?.boundingBox();
                if (box === undefined || box === null || box.width < 0 || box.height < 0) break;
              }
              this.logger.info(`CAPTCHA: ${await BotUtils.getElementInnerText(el)}`);
            }
          }
          el = await this.page.waitForSelector('input[type=password]');
          await el?.focus();
          this.logger.debug('Typing password...');
          await el?.type(this.config.get('membean_auth.password'));
          this.logger.debug('Typed password.');
          await this.debugScreenshot('login_password');
          el = await this.page.waitForSelector('#passwordNext');
          await el?.click();
          await this.page.waitForNetworkIdle();
          break;
        }
        default: {
          throw new BlackbeanError(`Authentication method ${method} is not supported!`);
        }
      }
      this.loggedIn = true;
    } catch (e: any) {
      if (e instanceof Error) e = e.stack;
      this.logger.error(e);
    }
  }

  public async start (): Promise<void> {
    try {
      if (!this.initialized) throw new BotNotInitializedError();
      if (!this.loggedIn) throw new BotNotLoggedInError();
      await this.debugScreenshot('start_homepage');
      let time: number = this.config.get('bot.session_length');
      if (time === undefined || time <= 0 || time > 60) time = BotConfig.getDefault('bot.session_length');
      if (time === undefined) time = 15;
      time = Math.ceil(time / 5) * 5;
      let el: ElementHandle<Element> | null;
      el = await this.page.waitForSelector('#startTrainingBtn');
      el?.click();
      await this.page.waitForNetworkIdle({ timeout: 3000 }).catch(() => {});
      let selector: string = `#${cssEscape(time.toString())}_min_`;
      if (await BotUtils.elExists(this.page, selector)) {
        await this.debugScreenshot('start_session');
        this.logger.debug(`Starting ${time} minute training session...`);
        el = await this.page.waitForSelector(selector);
        el?.click();
        await this.page.waitForNetworkIdle();
        this.logger.debug('Started session');
      } else {
        this.logger.debug('Opened existing session');
      }
      console.log('\n');
      this.running = true;
      await this.debugScreenshot('run_init');
      let lastQuestionTime: number = Date.now();
      let questionId: string = '';
      selector = 'div[data-qid], #definition, #wordspell';
      while (this.running) {
        await BotUtils.sleep(100);
        if (await BotUtils.elExists(this.page, selector)) {
          let el: ElementHandle<Element> | null = await this.page.waitForSelector(selector);
          let qid: string | null = await el?.evaluate(n => n.getAttribute('data-qid')) || null;
          if (qid === null) {
            if (await BotUtils.elExists(this.page, '#definition')) {
              el = await this.page.waitForSelector('.wordform');
              qid = await BotUtils.getElementInnerText(el);
              this.word = qid;
            } else {
              qid = this.word + 'Spell';
            }
          }
          if (questionId !== qid) questionId = String(qid);
          else if (qid !== null) continue;
          let question: MembeanQuestion | undefined;
          if (await BotUtils.elExists(this.page, '.mc_context, .mc_alternate, .mc_blank_definition, .mc_blank_context')) question = new MultipleChoiceQuestion(this);
          else if (await BotUtils.elExists(this.page, '#constellation')) question = new ConstellationQuestion(this);
          else if (await BotUtils.elExists(this.page, '#definition')) question = new DefinitionQuestion(this);
          else if (await BotUtils.elExists(this.page, '#wordspell')) question = new WordSpellQuestion(this);
          else if (await BotUtils.elExists(this.page, '#letter-hint')) question = new SentenceWordQuestion(this);
          else if (await BotUtils.elExists(this.page, '.with-image > div#single-question')) question = new FinishWordQuestion(this);
          if (question !== undefined) {
            lastQuestionTime = Date.now();
            this.logger.info(`Question type: ${question.getType()}`);
            await this.debugScreenshot('run_question');
            try {
              await question.answer();
            } catch (e: any) {
              if (this.config.get('bot.recover_crash')) {
                let m: any = e;
                if (e instanceof Error) m = e.stack;
                this.logger.warn(e);
              } else {
                throw e;
              }
            }
            await this.page.waitForNetworkIdle({ timeout: 3000 }).catch(() => {});
            console.log('\n');
          }
        } else if (await BotUtils.elExists(this.page, '.take_a_break, .level_completed_info, .different_words_info')) {
          await this.debugScreenshot('run_message');
          const isBreak: boolean = await BotUtils.elExists(this.page, '.take_a_break');
          el = await this.page.waitForSelector('input[type="submit"]');
          await el?.click();
          await this.page.waitForNetworkIdle();
          if (isBreak) this.stop();
        } else if (Date.now() - lastQuestionTime >= 5000) {
          lastQuestionTime = Date.now();
          this.logger.warn('Could not detect a question.');
          await this.debugScreenshot('run_page');
        }
      }
      await this.browser.close();
    } catch (e: any) {
      if (e instanceof Error) e = e.stack;
      this.logger.error(e);
      this.stop();
    }
  }

  public async stop (): Promise<void> {
    this.running = false;
    try {
      const el: ElementHandle<Element> | null = await this.page.waitForSelector('input#done-btn');
      await el?.click();
    } catch {};
    try { await this.browser.close(); } catch {};
    process.exit();
  }

  public getConfig (): BotConfig {
    return this.config;
  }

  public getLogger (): Logger {
    return this.logger;
  }

  public getOpenAI (): OpenAI {
    return this.openai;
  }

  public getPage (): Page {
    return this.page;
  }

  public getHash (): string {
    return this.hash;
  }

  public getWord (): string {
    return this.word;
  }

  public async getDebugScreenshot (name: string): Promise<string> {
    const file: Buffer = await readFile(`${this.debugPath}/img/${name}.png`);
    const b64: string = file.toString('base64');
    return `data:image/png;base64,${b64}`;
  }

  private async debugScreenshot (name: string, el?: ElementHandle<Element> | null): Promise<void> {
    try {
      if (this.config.get('bot.debug')) {
        await mkdir(`${this.debugPath}/img/`, { recursive: true });
        await mkdir(`${this.debugPath}/html/`, { recursive: true });
        if (el !== undefined && el !== null) {
          await el.scrollIntoView();
          await el.screenshot({ path: `${this.debugPath}/img/${name}.png` });
        } else {
          await this.page.screenshot({ path: `${this.debugPath}/img/${name}.png`, fullPage: true });
          await writeFile(`${this.debugPath}/html/${name}.html`, await this.page.content(), 'utf8');
        }
      }
    } catch (e: any) {
      if (e instanceof Error) e = e.stack;
      this.logger.warn(e);
    }
  }
}

class BlackbeanError extends Error {
  constructor (message: string) {
    super(message);
  }
}

class BotNotInitializedError extends Error {
  constructor () {
    super('Bot is not initialized!');
  }
}

class BotNotLoggedInError extends Error {
  constructor () {
    super('Bot is not logged in!');
  }
}

class BotAlreadyInitializedError extends Error {
  constructor () {
    super('Bot is already initialized!');
  }
}

class BotAlreadyLoggedInError extends Error {
  constructor () {
    super('Bot is already logged in!');
  }
}
