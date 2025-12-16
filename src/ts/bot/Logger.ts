import chalk from 'chalk';

import { BotConfig } from './BotConfig.js';

export class Logger {
  private readonly isDebug: boolean;
  private readonly hideLog: boolean;

  public constructor (config: BotConfig) {
    this.isDebug = config.get('bot.debug');
    this.hideLog = config.get('bot.hide_log');
  }

  private format (msg: any, ...args: any[]): string {
    let ret = msg;
    if (typeof ret === 'object') ret = JSON.stringify(ret);
    for (const arg of args) ret = ret.replace('{}', typeof arg === 'object' ? JSON.stringify(arg) : String(arg));
    return ret;
  }

  private print (color: (txt: string) => string, level: string, msg: string, ...args: any[]): void {
    if (!this.hideLog) console.log(`${String(chalk.gray(new Date().toLocaleTimeString()))} ${color(level.padEnd(6))} ${this.format(msg, ...args)}`);
  }

  public info (msg: any, ...args: any[]): void {
    this.print(chalk.blue, 'INFO', msg, ...args);
  }

  public warn (msg: any, ...args: any[]): void {
    this.print(chalk.yellow, 'WARN', msg, ...args);
  }

  public error (msg: any, ...args: any[]): void {
    this.print(chalk.red, 'ERROR', msg, ...args);
  }

  public success (msg: any, ...args: any[]): void {
    this.print(chalk.green, 'OK', msg, ...args);
  }

  public debug (msg: any, ...args: any[]): void {
    if (this.isDebug) this.print(chalk.magenta, 'DEBUG', msg, ...args);
  }
}
