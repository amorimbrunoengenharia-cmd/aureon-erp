/**
 * AUREON ERP - UI Executor
 * Executes UI interactions using Playwright
 */

import { chromium } from 'playwright';
import config from '../config.js';

export class UiExecutor {
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.browser = null;
    this.page = null;
    this.screenshots = [];
  }

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: config.frontend.headless,
        slowMo: config.frontend.slowMo
      });
      this.page = await this.browser.newPage();
      this.page.setDefaultTimeout(30000);
    }
  }

  async execute(action, params = {}) {
    await this.init();

    const [verb, ...rest] = action.split(' ');
    const target = rest.join(' ');

    switch (verb.toLowerCase()) {
      case 'goto':
        await this.page.goto(params.url || `${config.frontend.baseUrl}${target}`);
        break;

      case 'click':
        await this.page.click(params.selector || target);
        break;

      case 'fill':
        await this.page.fill(params.selector || target, params.value);
        break;

      case 'type':
        await this.page.type(params.selector || target, params.value);
        break;

      case 'select':
        await this.page.selectOption(params.selector || target, params.value);
        break;

      case 'wait':
        if (params.selector) {
          await this.page.waitForSelector(params.selector, { timeout: params.timeout });
        } else {
          await this.page.waitForTimeout(params.ms || 1000);
        }
        break;

      case 'screenshot':
        const screenshot = await this.page.screenshot({ fullPage: true });
        this.screenshots.push({
          timestamp: new Date().toISOString(),
          data: screenshot.toString('base64')
        });
        break;

      case 'evaluate':
        return await this.page.evaluate(params.script);

      default:
        throw new Error(`Unknown UI action: ${verb}`);
    }

    return { success: true };
  }

  async screenshot() {
    if (!this.page) return null;
    const screenshot = await this.page.screenshot({ fullPage: true });
    return screenshot.toString('base64');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  getScreenshots() {
    return this.screenshots;
  }
}
