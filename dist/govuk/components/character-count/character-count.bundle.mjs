function closestAttributeValue($element, attributeName) {
  const $closestElementWithAttribute = $element.closest(`[${attributeName}]`);
  return $closestElementWithAttribute ? $closestElementWithAttribute.getAttribute(attributeName) : null;
}

function mergeConfigs() {
  const flattenObject = function flattenObject(configObject) {
    const flattenedObject = {};
    const flattenLoop = function flattenLoop(obj, prefix) {
      for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) {
          continue;
        }
        const value = obj[key];
        const prefixedKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object') {
          flattenLoop(value, prefixedKey);
        } else {
          flattenedObject[prefixedKey] = value;
        }
      }
    };
    flattenLoop(configObject);
    return flattenedObject;
  };
  const formattedConfigObject = {};
  for (let i = 0; i < arguments.length; i++) {
    const obj = flattenObject(arguments[i]);
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        formattedConfigObject[key] = obj[key];
      }
    }
  }
  return formattedConfigObject;
}
function extractConfigByNamespace(configObject, namespace) {
  if (!configObject || typeof configObject !== 'object') {
    throw new Error('Provide a `configObject` of type "object".');
  }
  if (!namespace || typeof namespace !== 'string') {
    throw new Error('Provide a `namespace` of type "string" to filter the `configObject` by.');
  }
  const newObject = {};
  for (const key in configObject) {
    const keyParts = key.split('.');
    if (Object.prototype.hasOwnProperty.call(configObject, key) && keyParts[0] === namespace) {
      if (keyParts.length > 1) {
        keyParts.shift();
      }
      const newKey = keyParts.join('.');
      newObject[newKey] = configObject[key];
    }
  }
  return newObject;
}
function isSupported($scope = document.body) {
  return $scope.classList.contains('govuk-frontend-supported');
}
function validateConfig(schema, config) {
  const validationErrors = [];
  for (const [name, conditions] of Object.entries(schema)) {
    const errors = [];
    for (const {
      required,
      errorMessage
    } of conditions) {
      if (!required.every(key => !!config[key])) {
        errors.push(errorMessage);
      }
    }
    if (name === 'anyOf' && !(conditions.length - errors.length >= 1)) {
      validationErrors.push(...errors);
    }
  }
  return validationErrors;
}

/**
 * Schema for component config
 *
 * @typedef {object} Schema
 * @property {SchemaCondition[]} [anyOf] - List of schema conditions
 */

/**
 * Schema condition for component config
 *
 * @typedef {object} SchemaCondition
 * @property {string[]} required - List of required config fields
 * @property {string} errorMessage - Error message when required config fields not provided
 */

/**
 * @typedef {import('govuk-frontend').Config} Config - Config for all components via `initAll()`
 * @typedef {import('govuk-frontend').ConfigKey} ConfigKey - Component config keys, e.g. `accordion` and `characterCount`
 */

function normaliseString(value) {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmedValue = value.trim();
  if (trimmedValue === 'true') {
    return true;
  }
  if (trimmedValue === 'false') {
    return false;
  }
  if (trimmedValue.length > 0 && isFinite(Number(trimmedValue))) {
    return Number(trimmedValue);
  }
  return value;
}
function normaliseDataset(dataset) {
  const out = {};
  for (const key in dataset) {
    out[key] = normaliseString(dataset[key]);
  }
  return out;
}

class GOVUKFrontendError extends Error {
  constructor(...args) {
    super(...args);
    this.name = 'GOVUKFrontendError';
  }
}
class SupportError extends GOVUKFrontendError {
  constructor() {
    super('GOV.UK Frontend is not supported in this browser');
    this.name = 'SupportError';
  }
}
class ConfigError extends GOVUKFrontendError {
  constructor(...args) {
    super(...args);
    this.name = 'ConfigError';
  }
}
class ElementError extends GOVUKFrontendError {
  /**
   * @param {Element | null} element - The element in error
   * @param {object} options - Element error options
   * @param {string} options.componentName - The name of the component throwing the error
   * @param {string} options.identifier - An identifier that'll let the user understand which element has an error (variable name, CSS selector)
   * @param {string | typeof HTMLElement} [options.expectedType] - The type that was expected for the identifier
   */
  constructor(element, {
    componentName,
    identifier,
    expectedType
  }) {
    let reason = `${identifier} not found`;
    if (element) {
      expectedType = expectedType || window.HTMLElement;
      reason = typeof expectedType === 'string' ? `${identifier} is not of type ${expectedType}` : `${identifier} is not an instance of ${expectedType.name}`;
    }
    super(`${componentName}: ${reason}`);
    this.name = 'ElementError';
  }
}

class GOVUKFrontendComponent {
  constructor() {
    this.checkSupport();
  }
  checkSupport() {
    if (!isSupported()) {
      throw new SupportError();
    }
  }
}

class I18n {
  constructor(translations, config) {
    this.translations = void 0;
    this.locale = void 0;
    this.translations = translations || {};
    this.locale = config && config.locale || document.documentElement.lang || 'en';
  }
  t(lookupKey, options) {
    if (!lookupKey) {
      throw new Error('i18n: lookup key missing');
    }
    if (options && typeof options.count === 'number') {
      lookupKey = `${lookupKey}.${this.getPluralSuffix(lookupKey, options.count)}`;
    }
    const translationString = this.translations[lookupKey];
    if (typeof translationString === 'string') {
      if (translationString.match(/%{(.\S+)}/)) {
        if (!options) {
          throw new Error('i18n: cannot replace placeholders in string if no option data provided');
        }
        return this.replacePlaceholders(translationString, options);
      } else {
        return translationString;
      }
    } else {
      return lookupKey;
    }
  }
  replacePlaceholders(translationString, options) {
    let formatter;
    if (this.hasIntlNumberFormatSupport()) {
      formatter = new Intl.NumberFormat(this.locale);
    }
    return translationString.replace(/%{(.\S+)}/g, function (placeholderWithBraces, placeholderKey) {
      if (Object.prototype.hasOwnProperty.call(options, placeholderKey)) {
        const placeholderValue = options[placeholderKey];
        if (placeholderValue === false || typeof placeholderValue !== 'number' && typeof placeholderValue !== 'string') {
          return '';
        }
        if (typeof placeholderValue === 'number') {
          return formatter ? formatter.format(placeholderValue) : `${placeholderValue}`;
        }
        return placeholderValue;
      } else {
        throw new Error(`i18n: no data found to replace ${placeholderWithBraces} placeholder in string`);
      }
    });
  }
  hasIntlPluralRulesSupport() {
    return Boolean(window.Intl && 'PluralRules' in window.Intl && Intl.PluralRules.supportedLocalesOf(this.locale).length);
  }
  hasIntlNumberFormatSupport() {
    return Boolean(window.Intl && 'NumberFormat' in window.Intl && Intl.NumberFormat.supportedLocalesOf(this.locale).length);
  }
  getPluralSuffix(lookupKey, count) {
    count = Number(count);
    if (!isFinite(count)) {
      return 'other';
    }
    let preferredForm;
    if (this.hasIntlPluralRulesSupport()) {
      preferredForm = new Intl.PluralRules(this.locale).select(count);
    } else {
      preferredForm = this.selectPluralFormUsingFallbackRules(count);
    }
    if (`${lookupKey}.${preferredForm}` in this.translations) {
      return preferredForm;
    } else if (`${lookupKey}.other` in this.translations) {
      if (console && 'warn' in console) {
        console.warn(`i18n: Missing plural form ".${preferredForm}" for "${this.locale}" locale. Falling back to ".other".`);
      }
      return 'other';
    } else {
      throw new Error(`i18n: Plural form ".other" is required for "${this.locale}" locale`);
    }
  }
  selectPluralFormUsingFallbackRules(count) {
    count = Math.abs(Math.floor(count));
    const ruleset = this.getPluralRulesForLocale();
    if (ruleset) {
      return I18n.pluralRules[ruleset](count);
    }
    return 'other';
  }
  getPluralRulesForLocale() {
    const locale = this.locale;
    const localeShort = locale.split('-')[0];
    for (const pluralRule in I18n.pluralRulesMap) {
      if (Object.prototype.hasOwnProperty.call(I18n.pluralRulesMap, pluralRule)) {
        const languages = I18n.pluralRulesMap[pluralRule];
        for (let i = 0; i < languages.length; i++) {
          if (languages[i] === locale || languages[i] === localeShort) {
            return pluralRule;
          }
        }
      }
    }
  }
}
I18n.pluralRulesMap = {
  arabic: ['ar'],
  chinese: ['my', 'zh', 'id', 'ja', 'jv', 'ko', 'ms', 'th', 'vi'],
  french: ['hy', 'bn', 'fr', 'gu', 'hi', 'fa', 'pa', 'zu'],
  german: ['af', 'sq', 'az', 'eu', 'bg', 'ca', 'da', 'nl', 'en', 'et', 'fi', 'ka', 'de', 'el', 'hu', 'lb', 'no', 'so', 'sw', 'sv', 'ta', 'te', 'tr', 'ur'],
  irish: ['ga'],
  russian: ['ru', 'uk'],
  scottish: ['gd'],
  spanish: ['pt-PT', 'it', 'es'],
  welsh: ['cy']
};
I18n.pluralRules = {
  arabic(n) {
    if (n === 0) {
      return 'zero';
    }
    if (n === 1) {
      return 'one';
    }
    if (n === 2) {
      return 'two';
    }
    if (n % 100 >= 3 && n % 100 <= 10) {
      return 'few';
    }
    if (n % 100 >= 11 && n % 100 <= 99) {
      return 'many';
    }
    return 'other';
  },
  chinese() {
    return 'other';
  },
  french(n) {
    return n === 0 || n === 1 ? 'one' : 'other';
  },
  german(n) {
    return n === 1 ? 'one' : 'other';
  },
  irish(n) {
    if (n === 1) {
      return 'one';
    }
    if (n === 2) {
      return 'two';
    }
    if (n >= 3 && n <= 6) {
      return 'few';
    }
    if (n >= 7 && n <= 10) {
      return 'many';
    }
    return 'other';
  },
  russian(n) {
    const lastTwo = n % 100;
    const last = lastTwo % 10;
    if (last === 1 && lastTwo !== 11) {
      return 'one';
    }
    if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) {
      return 'few';
    }
    if (last === 0 || last >= 5 && last <= 9 || lastTwo >= 11 && lastTwo <= 14) {
      return 'many';
    }
    return 'other';
  },
  scottish(n) {
    if (n === 1 || n === 11) {
      return 'one';
    }
    if (n === 2 || n === 12) {
      return 'two';
    }
    if (n >= 3 && n <= 10 || n >= 13 && n <= 19) {
      return 'few';
    }
    return 'other';
  },
  spanish(n) {
    if (n === 1) {
      return 'one';
    }
    if (n % 1000000 === 0 && n !== 0) {
      return 'many';
    }
    return 'other';
  },
  welsh(n) {
    if (n === 0) {
      return 'zero';
    }
    if (n === 1) {
      return 'one';
    }
    if (n === 2) {
      return 'two';
    }
    if (n === 3) {
      return 'few';
    }
    if (n === 6) {
      return 'many';
    }
    return 'other';
  }
};

/**
 * Character count component
 *
 * Tracks the number of characters or words in the `.govuk-js-character-count`
 * `<textarea>` inside the element. Displays a message with the remaining number
 * of characters/words available, or the number of characters/words in excess.
 *
 * You can configure the message to only appear after a certain percentage
 * of the available characters/words has been entered.
 *
 * @preserve
 */
class CharacterCount extends GOVUKFrontendComponent {
  /**
   * @param {Element} $module - HTML element to use for character count
   * @param {CharacterCountConfig} [config] - Character count config
   */
  constructor($module, config) {
    super();
    this.$module = void 0;
    this.$textarea = void 0;
    this.$visibleCountMessage = null;
    this.$screenReaderCountMessage = null;
    this.lastInputTimestamp = null;
    this.lastInputValue = '';
    this.valueChecker = null;
    this.config = void 0;
    this.i18n = void 0;
    this.maxLength = Infinity;
    if (!($module instanceof HTMLElement)) {
      throw new ElementError($module, {
        componentName: 'Character count',
        identifier: '$module'
      });
    }
    const $textarea = $module.querySelector('.govuk-js-character-count');
    if (!($textarea instanceof HTMLTextAreaElement || $textarea instanceof HTMLInputElement)) {
      throw new ElementError($textarea, {
        componentName: 'Character count',
        identifier: '.govuk-js-character-count',
        expectedType: 'HTMLTextareaElement or HTMLInputElement'
      });
    }
    const datasetConfig = normaliseDataset($module.dataset);
    let configOverrides = {};
    if ('maxwords' in datasetConfig || 'maxlength' in datasetConfig) {
      configOverrides = {
        maxlength: undefined,
        maxwords: undefined
      };
    }
    this.config = mergeConfigs(CharacterCount.defaults, config || {}, configOverrides, datasetConfig);
    const errors = validateConfig(CharacterCount.schema, this.config);
    if (errors[0]) {
      throw new ConfigError(`Character count: ${errors[0]}`);
    }
    this.i18n = new I18n(extractConfigByNamespace(this.config, 'i18n'), {
      locale: closestAttributeValue($module, 'lang')
    });
    this.maxLength = this.config.maxwords || this.config.maxlength;
    this.$module = $module;
    this.$textarea = $textarea;
    const textareaDescriptionId = `${this.$textarea.id}-info`;
    const $textareaDescription = document.getElementById(textareaDescriptionId);
    if (!$textareaDescription) {
      throw new ElementError($textareaDescription, {
        componentName: 'Character count',
        identifier: `#${textareaDescriptionId}`
      });
    }
    if ($textareaDescription.textContent.match(/^\s*$/)) {
      $textareaDescription.textContent = this.i18n.t('textareaDescription', {
        count: this.maxLength
      });
    }
    this.$textarea.insertAdjacentElement('afterend', $textareaDescription);
    const $screenReaderCountMessage = document.createElement('div');
    $screenReaderCountMessage.className = 'govuk-character-count__sr-status govuk-visually-hidden';
    $screenReaderCountMessage.setAttribute('aria-live', 'polite');
    this.$screenReaderCountMessage = $screenReaderCountMessage;
    $textareaDescription.insertAdjacentElement('afterend', $screenReaderCountMessage);
    const $visibleCountMessage = document.createElement('div');
    $visibleCountMessage.className = $textareaDescription.className;
    $visibleCountMessage.classList.add('govuk-character-count__status');
    $visibleCountMessage.setAttribute('aria-hidden', 'true');
    this.$visibleCountMessage = $visibleCountMessage;
    $textareaDescription.insertAdjacentElement('afterend', $visibleCountMessage);
    $textareaDescription.classList.add('govuk-visually-hidden');
    this.$textarea.removeAttribute('maxlength');
    this.bindChangeEvents();
    window.addEventListener('pageshow', () => this.updateCountMessage());
    this.updateCountMessage();
  }
  bindChangeEvents() {
    this.$textarea.addEventListener('keyup', () => this.handleKeyUp());
    this.$textarea.addEventListener('focus', () => this.handleFocus());
    this.$textarea.addEventListener('blur', () => this.handleBlur());
  }
  handleKeyUp() {
    this.updateVisibleCountMessage();
    this.lastInputTimestamp = Date.now();
  }
  handleFocus() {
    this.valueChecker = window.setInterval(() => {
      if (!this.lastInputTimestamp || Date.now() - 500 >= this.lastInputTimestamp) {
        this.updateIfValueChanged();
      }
    }, 1000);
  }
  handleBlur() {
    clearInterval(this.valueChecker);
  }
  updateIfValueChanged() {
    if (this.$textarea.value !== this.lastInputValue) {
      this.lastInputValue = this.$textarea.value;
      this.updateCountMessage();
    }
  }
  updateCountMessage() {
    this.updateVisibleCountMessage();
    this.updateScreenReaderCountMessage();
  }
  updateVisibleCountMessage() {
    const remainingNumber = this.maxLength - this.count(this.$textarea.value);
    if (this.isOverThreshold()) {
      this.$visibleCountMessage.classList.remove('govuk-character-count__message--disabled');
    } else {
      this.$visibleCountMessage.classList.add('govuk-character-count__message--disabled');
    }
    if (remainingNumber < 0) {
      this.$textarea.classList.add('govuk-textarea--error');
      this.$visibleCountMessage.classList.remove('govuk-hint');
      this.$visibleCountMessage.classList.add('govuk-error-message');
    } else {
      this.$textarea.classList.remove('govuk-textarea--error');
      this.$visibleCountMessage.classList.remove('govuk-error-message');
      this.$visibleCountMessage.classList.add('govuk-hint');
    }
    this.$visibleCountMessage.textContent = this.getCountMessage();
  }
  updateScreenReaderCountMessage() {
    if (this.isOverThreshold()) {
      this.$screenReaderCountMessage.removeAttribute('aria-hidden');
    } else {
      this.$screenReaderCountMessage.setAttribute('aria-hidden', 'true');
    }
    this.$screenReaderCountMessage.textContent = this.getCountMessage();
  }
  count(text) {
    if (this.config.maxwords) {
      const tokens = text.match(/\S+/g) || [];
      return tokens.length;
    } else {
      return text.length;
    }
  }
  getCountMessage() {
    const remainingNumber = this.maxLength - this.count(this.$textarea.value);
    const countType = this.config.maxwords ? 'words' : 'characters';
    return this.formatCountMessage(remainingNumber, countType);
  }
  formatCountMessage(remainingNumber, countType) {
    if (remainingNumber === 0) {
      return this.i18n.t(`${countType}AtLimit`);
    }
    const translationKeySuffix = remainingNumber < 0 ? 'OverLimit' : 'UnderLimit';
    return this.i18n.t(`${countType}${translationKeySuffix}`, {
      count: Math.abs(remainingNumber)
    });
  }
  isOverThreshold() {
    if (!this.config.threshold) {
      return true;
    }
    const currentLength = this.count(this.$textarea.value);
    const maxLength = this.maxLength;
    const thresholdValue = maxLength * this.config.threshold / 100;
    return thresholdValue <= currentLength;
  }
}

/**
 * Character count config
 *
 * @see {@link CharacterCount.defaults}
 * @typedef {object} CharacterCountConfig
 * @property {number} [maxlength] - The maximum number of characters.
 *   If maxwords is provided, the maxlength option will be ignored.
 * @property {number} [maxwords] - The maximum number of words. If maxwords is
 *   provided, the maxlength option will be ignored.
 * @property {number} [threshold=0] - The percentage value of the limit at
 *   which point the count message is displayed. If this attribute is set, the
 *   count message will be hidden by default.
 * @property {CharacterCountTranslations} [i18n=CharacterCount.defaults.i18n] - Character count translations
 */

/**
 * Character count translations
 *
 * @see {@link CharacterCount.defaults.i18n}
 * @typedef {object} CharacterCountTranslations
 *
 * Messages shown to users as they type. It provides feedback on how many words
 * or characters they have remaining or if they are over the limit. This also
 * includes a message used as an accessible description for the textarea.
 * @property {TranslationPluralForms} [charactersUnderLimit] - Message displayed
 *   when the number of characters is under the configured maximum, `maxlength`.
 *   This message is displayed visually and through assistive technologies. The
 *   component will replace the `%{count}` placeholder with the number of
 *   remaining characters. This is a [pluralised list of
 *   messages](https://frontend.design-system.service.gov.uk/localise-govuk-frontend).
 * @property {string} [charactersAtLimit] - Message displayed when the number of
 *   characters reaches the configured maximum, `maxlength`. This message is
 *   displayed visually and through assistive technologies.
 * @property {TranslationPluralForms} [charactersOverLimit] - Message displayed
 *   when the number of characters is over the configured maximum, `maxlength`.
 *   This message is displayed visually and through assistive technologies. The
 *   component will replace the `%{count}` placeholder with the number of
 *   remaining characters. This is a [pluralised list of
 *   messages](https://frontend.design-system.service.gov.uk/localise-govuk-frontend).
 * @property {TranslationPluralForms} [wordsUnderLimit] - Message displayed when
 *   the number of words is under the configured maximum, `maxlength`. This
 *   message is displayed visually and through assistive technologies. The
 *   component will replace the `%{count}` placeholder with the number of
 *   remaining words. This is a [pluralised list of
 *   messages](https://frontend.design-system.service.gov.uk/localise-govuk-frontend).
 * @property {string} [wordsAtLimit] - Message displayed when the number of
 *   words reaches the configured maximum, `maxlength`. This message is
 *   displayed visually and through assistive technologies.
 * @property {TranslationPluralForms} [wordsOverLimit] - Message displayed when
 *   the number of words is over the configured maximum, `maxlength`. This
 *   message is displayed visually and through assistive technologies. The
 *   component will replace the `%{count}` placeholder with the number of
 *   remaining words. This is a [pluralised list of
 *   messages](https://frontend.design-system.service.gov.uk/localise-govuk-frontend).
 * @property {TranslationPluralForms} [textareaDescription] - Message made
 *   available to assistive technologies, if none is already present in the
 *   HTML, to describe that the component accepts only a limited amount of
 *   content. It is visible on the page when JavaScript is unavailable. The
 *   component will replace the `%{count}` placeholder with the value of the
 *   `maxlength` or `maxwords` parameter.
 */

/**
 * @typedef {import('../../common/index.mjs').Schema} Schema
 * @typedef {import('../../i18n.mjs').TranslationPluralForms} TranslationPluralForms
 */
CharacterCount.moduleName = 'govuk-character-count';
CharacterCount.defaults = Object.freeze({
  threshold: 0,
  i18n: {
    charactersUnderLimit: {
      one: 'You have %{count} character remaining',
      other: 'You have %{count} characters remaining'
    },
    charactersAtLimit: 'You have 0 characters remaining',
    charactersOverLimit: {
      one: 'You have %{count} character too many',
      other: 'You have %{count} characters too many'
    },
    wordsUnderLimit: {
      one: 'You have %{count} word remaining',
      other: 'You have %{count} words remaining'
    },
    wordsAtLimit: 'You have 0 words remaining',
    wordsOverLimit: {
      one: 'You have %{count} word too many',
      other: 'You have %{count} words too many'
    },
    textareaDescription: {
      other: ''
    }
  }
});
CharacterCount.schema = Object.freeze({
  anyOf: [{
    required: ['maxwords'],
    errorMessage: 'Either "maxlength" or "maxwords" must be provided'
  }, {
    required: ['maxlength'],
    errorMessage: 'Either "maxlength" or "maxwords" must be provided'
  }]
});

export { CharacterCount };
//# sourceMappingURL=character-count.bundle.mjs.map
