const CONFIG_DEFAULT = {
  bot: {
    debug: false,
    hide_log: false,
    headless: false,
    recover_crash: false,
    session_length: 15
  },
  api: {
    base_url: 'https://api.openai.com/v1',
    api_key: 'OPENAI_API_KEY',
    model: 'gpt-5.2'
  },
  membean_auth: {
    auth_method: 'MEMBEAN',
    email: 'USER_EMAIL',
    password: 'USER_PASSWORD'
  },
  answers: {
    accuracy: 90,
    delay_min: 3000,
    delay_max: 7000
  }
};

type Json = string | number | boolean | null | Json[] | { [k: string]: Json; };

export class BotConfig {
  private readonly config: any = {};

  public constructor (j: any) {
    this.config = this.merge(CONFIG_DEFAULT as any, j);
  }

  private merge<T extends Json>(a: T, b?: Partial<T>): T {
    if (b === undefined) return a;
    if (Array.isArray(a)) return (b as any ?? a) as T;
    if (a !== null && typeof a === 'object' && !Array.isArray(a)) {
      const o: any = { ...(a as any) };
      if (b && typeof b === 'object' && !Array.isArray(b)) {
        for (const k of Object.keys(b)) {
          const av = (a as any)[k]; const bv = (b as any)[k];
          o[k] = (av && typeof av === 'object' && !Array.isArray(av) && bv && typeof bv === 'object' && !Array.isArray(bv))
            ? this.merge(av, bv)
            : (bv === undefined ? av : bv);
        }
      }
      return o;
    }
    return (b as any) as T;
  }

  public get (p: string): any {
    const find = (obj: any, path: string): any => {
      if (!path) return obj;
      return path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), obj);
    };
    const v = find(this.config, p);
    return v === undefined ? find(CONFIG_DEFAULT, p) : v;
  }

  public static getDefault (p: string): any {
    const find = (obj: any, path: string): any => {
      if (!path) return obj;
      return path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), obj);
    };
    return find(CONFIG_DEFAULT, p);
  }
}
