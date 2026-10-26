// Shape of HubSpot's V4 "render definition", the JSON their own embed uses to draw forms built in
// the new editor. Undocumented: only the parts we render are typed, and unknown modules are reported.

export interface HubSpotOption {
  label: string;
  value: string;
  selected?: boolean;
}

interface BaseModule {
  type: string;
  id: number | string;
  conditionallyHidden?: boolean;
}

export interface FieldModule extends BaseModule {
  type:
    | 'text'
    | 'email'
    | 'textarea'
    | 'number'
    | 'phoneNumber'
    | 'url'
    | 'date'
    | 'dropdownSelect'
    | 'radioSelect'
    | 'multipleCheckbox'
    | 'singleCheckbox'
    | 'file';
  label: string;
  required: boolean;
  /** "{objectTypeId}/{propertyName}", e.g. "0-1/email" */
  propertyReference: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  options?: HubSpotOption[];
}

export interface HiddenModule extends BaseModule {
  type: 'hidden';
  propertyReference: string;
  defaultValue?: string;
  value?: string;
}

export interface RichTextModule extends BaseModule {
  type: 'richText';
  html: string;
}

export interface HeadingModule extends BaseModule {
  type: 'heading';
  text: string;
  level: number;
}

export interface DataPrivacyModule extends BaseModule {
  type: 'dataPrivacy';
  isLegitimateInterest: boolean;
  processingConsentType: 'REQUIRED_CHECKBOX' | (string & {});
  legitimateInterestSubscriptionTypes: number[];
  legitimateInterestLegalBasis?: string;
  communicationConsentCheckboxes: { communicationTypeId: number; label: string; required: boolean }[];
  communicationConsentText?: string;
  processingConsentText?: string;
  processingConsentCheckboxLabel?: string;
  privacyPolicyText?: string;
}

export interface ProgressBarModule extends BaseModule {
  type: 'progressBar';
  format: string;
}

export interface ButtonModule extends BaseModule {
  type: 'nextButton' | 'previousButton' | 'submitButton';
  text: string;
}

export type ContentModule =
  | FieldModule
  | HiddenModule
  | RichTextModule
  | HeadingModule
  | DataPrivacyModule
  | ProgressBarModule
  | (BaseModule & Record<string, unknown>);

export interface RowModule extends BaseModule {
  type: 'row';
  modules: ContentModule[];
}

export interface NavigationRowModule extends BaseModule {
  type: 'navigationRow';
  modules: ButtonModule[];
}

export interface StepModule extends BaseModule {
  type: 'step';
  layoutTemplate?: string;
  modules: (RowModule | NavigationRowModule)[];
}

export interface RenderDefinition {
  portalId: number;
  form: {
    id: string;
    type: string;
    modules: StepModule[];
    logicRules: Record<string, unknown>;
    lastUpdatedAt: number;
  };
  postSubmit: { modules: StepModule[] };
  settings: {
    enabledLiveValidation: boolean;
    locale: string;
    hpEnabled: boolean;
    [key: string]: unknown;
  };
  translations: Record<string, string>;
}

/** Extra classes added alongside the built-in `hsf-*` ones, for sites that style with classes. */
export interface HubSpotFormClasses {
  /** Text inputs, selects and textareas. */
  input?: string;
  /** Checkbox and radio inputs. */
  checkbox?: string;
  label?: string;
  /** Every button (next, previous and submit). */
  button?: string;
  next?: string;
  previous?: string;
  submit?: string;
  /** Inline field error messages. */
  error?: string;
}

// Everything the browser needs to validate and submit, serialised into the page.
export interface ClientFormConfig {
  portalId: string;
  formId: string;
  liveValidation: boolean;
  consent?: {
    legitimateInterest?: { subscriptionTypeId: number; legalBasis: string; text: string };
    processing: 'checkbox' | 'implicit';
    processingText: string;
    communications: { subscriptionTypeId: number; text: string }[];
  };
  messages: {
    required: string;
    email: string;
    number: string;
    date: string;
    generic: string;
  };
}
