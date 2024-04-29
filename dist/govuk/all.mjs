export { version } from './common/govuk-frontend-version.mjs';
import { isSupported } from './common/index.mjs';
export { Accordion } from './components/accordion/accordion.mjs';
export { Button } from './components/button/button.mjs';
export { CharacterCount } from './components/character-count/character-count.mjs';
export { Checkboxes } from './components/checkboxes/checkboxes.mjs';
export { ErrorSummary } from './components/error-summary/error-summary.mjs';
export { ExitThisPage } from './components/exit-this-page/exit-this-page.mjs';
export { Header } from './components/header/header.mjs';
export { NotificationBanner } from './components/notification-banner/notification-banner.mjs';
export { PasswordInput } from './components/password-input/password-input.mjs';
export { Radios } from './components/radios/radios.mjs';
export { SkipLink } from './components/skip-link/skip-link.mjs';
export { Tabs } from './components/tabs/tabs.mjs';
import { SupportError } from './errors/index.mjs';

/**
 * Initialise all components
 *
 * Use the `data-module` attributes to find, instantiate and init all of the
 * components provided as part of GOV.UK Frontend.
 *
 * @param {Config & { scope?: Element }} [config] - Config for all components (with optional scope)
 */
function initAll(config) {
  if (!isSupported()) {
    console.log(new SupportError());
    return;
  }
}

/**
 * Config for all components via `initAll()`
 *
 * @typedef {object} Config
 * @property {AccordionConfig} [accordion] - Accordion config
 * @property {ButtonConfig} [button] - Button config
 * @property {CharacterCountConfig} [characterCount] - Character Count config
 * @property {ErrorSummaryConfig} [errorSummary] - Error Summary config
 * @property {ExitThisPageConfig} [exitThisPage] - Exit This Page config
 * @property {NotificationBannerConfig} [notificationBanner] - Notification Banner config
 * @property {PasswordInputConfig} [passwordInput] - Password input config
 */

/**
 * Config for individual components
 *
 * @typedef {import('./components/accordion/accordion.mjs').AccordionConfig} AccordionConfig
 * @typedef {import('./components/accordion/accordion.mjs').AccordionTranslations} AccordionTranslations
 * @typedef {import('./components/button/button.mjs').ButtonConfig} ButtonConfig
 * @typedef {import('./components/character-count/character-count.mjs').CharacterCountConfig} CharacterCountConfig
 * @typedef {import('./components/character-count/character-count.mjs').CharacterCountTranslations} CharacterCountTranslations
 * @typedef {import('./components/error-summary/error-summary.mjs').ErrorSummaryConfig} ErrorSummaryConfig
 * @typedef {import('./components/exit-this-page/exit-this-page.mjs').ExitThisPageConfig} ExitThisPageConfig
 * @typedef {import('./components/exit-this-page/exit-this-page.mjs').ExitThisPageTranslations} ExitThisPageTranslations
 * @typedef {import('./components/notification-banner/notification-banner.mjs').NotificationBannerConfig} NotificationBannerConfig
 * @typedef {import('./components/password-input/password-input.mjs').PasswordInputConfig} PasswordInputConfig
 */

/**
 * Component config keys, e.g. `accordion` and `characterCount`
 *
 * @typedef {keyof Config} ConfigKey
 */

export { initAll };
//# sourceMappingURL=all.mjs.map
