import { ElementHandle, Page } from 'puppeteer';

export class BotUtils {
  public static async sleep (ms: number): Promise<void> {
    return await new Promise(resolve => setTimeout(resolve, ms));
  }

  public static rand (min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  public static async elExists (page: Page, selector: string): Promise<boolean> {
    try {
      return (await page.$(selector)) !== null;
    } catch {
      return false;
    }
  }

  public static async getElementId (el: ElementHandle<Element>): Promise<string> {
    return await el.evaluate(n => n.id);
  }

  public static async getElementInnerText (el: ElementHandle<Element> | null): Promise<string> {
    return await el?.evaluate(n => n.innerText || '') || '';
  }

  public static async getElementDatasetValue (el: ElementHandle<Element> | null, key: string): Promise<string> {
    return await el?.evaluate((n, k) => n.getAttribute(`data-${k}`) || '', key) || '';
  }

  public static async getImageElementSrc (el: ElementHandle<HTMLImageElement> | null): Promise<string> {
    return await el?.evaluate(n => n.src) || '';
  }

  public static async getInputElementMaxLength (el: ElementHandle<HTMLInputElement> | null): Promise<number> {
    return await el?.evaluate(n => n.maxLength || 0) || 0;
  }

  public static scrambleAnswer (correct: number | string, percent: number): number | string {
    const isCorrect: boolean = Math.round(Math.random() * 100) <= percent;
    if (typeof correct === 'number') {
      if (isCorrect) {
        return correct;
      } else {
        if (correct < 3) return correct + 1;
        else if (correct > 1) return correct - 1;
        else return correct;
      }
    } else {
      if (isCorrect) {
        return correct;
      } else {
        let str = '';
        for (let i = 0; i < correct.length; i++) str += String.fromCharCode(97 + Math.floor(Math.random() * 26));
        return str;
      }
    }
  }
}
