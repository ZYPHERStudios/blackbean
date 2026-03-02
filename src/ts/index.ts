import dotenv from 'dotenv';
import optimist from 'optimist';

import { MembeanBot } from './bot/MembeanBot.js';

dotenv.config({ path: '.env', override: false, quiet: true });
dotenv.config({ path: '.env.local', override: true, quiet: true });

const AUTH_METHOD_ENV: string | undefined = process.env.AUTH_METHOD;
const AUTH_EMAIL_ENV: string | undefined = process.env.AUTH_EMAIL;
const AUTH_PASSWD_ENV: string | undefined = process.env.AUTH_PASSWD;

const SESSION_LENGTH_ENV: string | undefined = process.env.SESSION_LENGTH;

const ANSWER_ACCURACY_ENV: string | undefined = process.env.ANSWER_ACCURACY;
const ANSWER_DELAY_MIN_ENV: string | undefined = process.env.ANSWER_DELAY_MIN;
const ANSWER_DELAY_MAX_ENV: string | undefined = process.env.ANSWER_DELAY_MAX;

const AI_API_BASE_ENV: string | undefined = process.env.AI_API_BASE;
const AI_API_KEY_ENV: string | undefined = process.env.AI_API_KEY;
const AI_API_MODEL_ENV: string | undefined = process.env.AI_API_MODEL;

const DEBUG_ENV: string | undefined = process.env.BB_DEBUG;
const SILENT_ENV: string | undefined = process.env.BB_SILENT;
const HEADLESS_ENV: string | undefined = process.env.BB_HEADLESS;

optimist.alias('e', 'email');
optimist.alias('passwd', 'password');
optimist.alias('p', 'password');
optimist.alias('l', 'length');
optimist.alias('acc', 'accuracy');
optimist.alias('h', 'headless');
optimist.alias('quiet', 'silent');
optimist.alias('q', 'silent');

optimist.describe('auth-method', 'Authentication method to use when logging into Membean');
optimist.describe('email', 'User Email');
optimist.describe('password', 'User Password');

optimist.describe('length', 'Length of Membean session');

optimist.describe('accuracy', 'Percent of correct answers');

optimist.describe('api-base', 'Base URL of the OpenAI-compatible API');
optimist.describe('api-key', 'API key used for accessing the AI service');
optimist.describe('api-model', 'Model ID to use when generating AI responses');

optimist.describe('debug', 'Enable verbose debug logging');
optimist.describe('silent', 'Disable all console output');
optimist.describe('headless', 'Run browser in headless mode');

if (!AUTH_METHOD_ENV) optimist.demand('auth-method');
if (!AUTH_EMAIL_ENV) optimist.demand('email');
if (!AUTH_PASSWD_ENV) optimist.demand('password');
if (!SESSION_LENGTH_ENV) optimist.demand('length');
if (!AI_API_BASE_ENV) optimist.demand('api-base');
if (!AI_API_KEY_ENV) optimist.demand('api-key');
if (!AI_API_MODEL_ENV) optimist.demand('api-model');

const ARGV: any = optimist.parse(process.argv);

function getBool (cli: any, env: string | undefined): boolean {
  if (cli !== undefined) return true;
  else return env !== undefined;
}

function getString (cli: string | undefined, env: string | undefined): string | undefined {
  if (cli !== undefined) return cli;
  else return env;
}

(async () => {
  const bot: MembeanBot = new MembeanBot({
    bot: {
      debug: getBool(ARGV.debug, DEBUG_ENV),
      hide_log: getBool(ARGV.silent, SILENT_ENV),
      headless: getBool(ARGV.headless, HEADLESS_ENV),
      recover_crash: true,
      session_length: getString(ARGV.length, SESSION_LENGTH_ENV)
    },
    api: {
      base_url: getString(ARGV['api-base'], AI_API_BASE_ENV),
      api_key: getString(ARGV['api-key'], AI_API_KEY_ENV),
      model: getString(ARGV['api-model'], AI_API_MODEL_ENV)
    },
    membean_auth: {
      auth_method: getString(ARGV['auth-method'], AUTH_METHOD_ENV),
      email: getString(ARGV.email, AUTH_EMAIL_ENV),
      password: getString(ARGV.password, AUTH_PASSWD_ENV)
    },
    answers: {
      accuracy: getString(ARGV.accuracy, ANSWER_ACCURACY_ENV),
      delay_min: getString(ARGV['delay-min'], ANSWER_DELAY_MIN_ENV),
      delay_max: getString(ARGV['delay-max'], ANSWER_DELAY_MAX_ENV)
    }
  });

  ['SIGINT', 'SIGTERM', 'uncaughtException', 'unhandledRejection'].forEach(s =>
    process.once(s as any, async () => { try { await bot?.stop(); } catch {} })
  );

  await bot.init();
  await bot.login();
  await bot.start();
})();
