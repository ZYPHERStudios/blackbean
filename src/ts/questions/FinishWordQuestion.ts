import { ImageToTextOutput, pipeline } from '@huggingface/transformers';
import cliProgress from 'cli-progress';
import { ChatCompletion } from 'openai/resources/index.mjs';
import { ElementHandle } from 'puppeteer';

import { BotUtils } from '../bot/BotUtils.js';
import { MembeanBot } from '../bot/MembeanBot.js';
import { Prompts } from '../bot/Prompts.js';

import { TypingQuestion } from './TypingQuestion.js';

let bar: any = null;

const captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', {
  dtype: 'fp32',
  progress_callback: (() => {
    const total = new Map<string, number>();
    const loaded = new Map<string, number>();
    return (p: any) => {
      if (!p?.file) return;

      if (p.status === 'initiate') {
        total.set(p.file, 0);
        loaded.set(p.file, 0);
        return;
      }

      if (p.status === 'progress') {
        total.set(p.file, p.total ?? 0);
        loaded.set(p.file, p.loaded ?? 0);

        const T = [...total.values()].reduce((a, x) => a + x, 0);
        const L = [...loaded.values()].reduce((a, x) => a + x, 0);

        if (!bar && T > 0) {
          bar = new cliProgress.SingleBar({ format: 'Downloading [{bar}] {percentage}% | {value}/{total} bytes | {file}' }, cliProgress.Presets.shades_classic);
          bar.start(T, L, { file: p.file });
        } else if (bar) {
          bar.setTotal(T);
          bar.update(L, { file: p.file });
        }
        return;
      }

      if (p.status === 'done') loaded.set(p.file, total.get(p.file) ?? 0);
    };
  })()
});

if (bar) bar.stop();

export class FinishWordQuestion extends TypingQuestion {
  public constructor (bot: MembeanBot) {
    super(bot, 'FINISH_WORD');
  }

  public override async answer (): Promise<void> {
    const tel: ElementHandle<Element> | null = await this.page.waitForSelector(TypingQuestion.CHOICE_SELECTOR);
    let el: ElementHandle<Element> | null = await this.page.waitForSelector('img#cloze-background');
    const cap: ImageToTextOutput | ImageToTextOutput[] = await captioner(await BotUtils.getImageElementSrc(el as ElementHandle<HTMLImageElement>));
    const item: any = Array.isArray(cap) ? cap[0] : cap;
    let s: string = item.generated_text ?? item.text ?? String(item);
    s = `caption: ${s}`;
    el = await this.page.waitForSelector('#word-hint p span');
    s += `\nhint: ${await BotUtils.getElementInnerText(el)}`;
    el = await this.page.waitForSelector('.first-letter');
    s += `\nfirst letter: ${await BotUtils.getElementInnerText(el)}`;
    s += `\nword length: ${await BotUtils.getInputElementMaxLength(tel as ElementHandle<HTMLInputElement>)}`;
    const response: ChatCompletion = await this.sendAPI(s, Prompts.SENTENCE_WORD);
    const time: number = this.getRandomTime();
    const answer: string = (response.choices[0].message.content || '-1').trim();
    this.logger.debug(`API answer: ${answer}`);
    await BotUtils.sleep(time);
    if (answer !== '-1') {
      await tel?.focus();
      for (const char of (BotUtils.scrambleAnswer(answer.substring(1), this.bot.getConfig().get('answers.accuracy')) as string)) {
        tel?.type(char);
        await BotUtils.sleep(time / 50);
      }
    } else {
      el = await this.page.waitForSelector('#notsure');
      el?.click();
    }
  }
}
