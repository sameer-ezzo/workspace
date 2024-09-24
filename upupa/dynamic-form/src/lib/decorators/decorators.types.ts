import { PasswordStrength } from '@upupa/auth';
import { Validator } from '../types';

export interface IDynamicFormFieldOptions {}
export class TextFieldOptions {}
export class NumberFieldOptions {}
export class BooleanFieldOptions {}
export class AdapterFieldOptions {
  minAllowed?: number = 1;
  maxAllowed?: number = 1;
  adapter: SimpleDataAdapter = { dataSource: 'client', data: [] };
}

export type SimpleDataAdapter =
  | SimpleServerDataAdapter
  | SimpleClientDataAdapter
  | SimpleUrlDataAdapter;

type SimpleDataAdapterBase = {
  dataSource: 'server' | 'client' | 'url';
  keyProperty?: string;
  displayProperty?: string;
  valueProperty?: string | string[];
  imageProperty?: string;
  providerOptions?: any;
  selectedColumns?: string[];
};

export type SimpleServerDataAdapter = SimpleDataAdapterBase & {
  dataSource: 'server';
  path: string;
};

export type SimpleClientDataAdapter = SimpleDataAdapterBase & {
  dataSource: 'client';
  data: any[];
};

export type SimpleUrlDataAdapter = SimpleDataAdapterBase & {
  dataSource: 'url';
  url: string;
};

export type BaseFormFieldOptions = {
  required?: boolean;
  validations?: Validator[];
};
export type VisibleFormFieldOptions = BaseFormFieldOptions & {
  label?: string;
  placeholder?: string;
  text?: string;
  hint?: string;
  appearance?: 'fill' | 'outline';
  disabled?: boolean;
  readonly?: boolean;
  hidden?: boolean;
};
export type FileInputOptions = {
  includeAccess?: boolean;
  base?: string;
  path?: string;
  color?: 'primary' | 'accent' | 'warn';
  dateFormat?: string;
  minAllowedFiles?: number;
  maxAllowedFiles?: number;
  minSize?: number;
  maxSize?: number;
  accept?: string;
  view?: 'list' | 'grid';
  fileSelector?: 'browser' | 'system';
};
export type ChoicesFieldOptions = VisibleFormFieldOptions &
  AdapterFieldOptions & {
    direction?: 'horizontal' | 'vertical';
    template?: 'normal' | 'thumbs';
    thumbSize?: number;
    renderer?: 'markdown' | 'html' | 'none';
  };
export type FormFieldOptions =
  | ({ from: any } & VisibleFormFieldOptions)
  | (
      | ({ input: 'fieldset' } & VisibleFormFieldOptions & BaseFormFieldOptions)
      | ({ input: 'hidden' } & BaseFormFieldOptions)
      | ({ input: 'text' } & VisibleFormFieldOptions & TextFieldOptions)
      | ({ input: 'textarea' } & VisibleFormFieldOptions &
          TextFieldOptions & {
            cdkAutosizeMinRows?: number;
            cdkAutosizeMaxRows?: number;
            cdkTextareaAutosize?: boolean;
          })
      | ({ input: 'phone' } & VisibleFormFieldOptions & TextFieldOptions)
      | ({ input: 'password' } & VisibleFormFieldOptions &
          TextFieldOptions & {
            showConfirmPasswordInput?: boolean;
            showPassword?: boolean;
            canGenerateRandomPassword?: boolean;
            passwordStrength?: PasswordStrength;
            autocomplete?: 'current-password' | 'new-password';
          })
      | ({ input: 'number' } & VisibleFormFieldOptions & NumberFieldOptions)
      | ({ input: 'switch' } & VisibleFormFieldOptions &
          BooleanFieldOptions & {
            template?: 'checkbox' | 'toggle';
            renderer?: 'markdown' | 'html' | 'none';
          })
      | ({ input: 'checks' } & ChoicesFieldOptions)
      | ({ input: 'radios' } & ChoicesFieldOptions)
      | ({ input: 'select' } & VisibleFormFieldOptions & AdapterFieldOptions)
      | ({ input: 'date' } & VisibleFormFieldOptions)
      | ({ input: 'file' } & VisibleFormFieldOptions & FileInputOptions)
      | ({ input: 'html' } & VisibleFormFieldOptions)
      | ({ input: 'chips' } & VisibleFormFieldOptions &
          AdapterFieldOptions & {
            parentPath?: string;
            visible?: boolean;
            selectable?: boolean;
            removable?: boolean;
            separatorKeysCodes?: string[];
          })
      | ({ input: string } & Partial<
          VisibleFormFieldOptions &
            AdapterFieldOptions & { inputs: Record<string, any> }
        >)
    );
