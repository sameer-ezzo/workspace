# upupa-dynamic-form

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test upupa-dynamic-form` to execute the unit tests.

## Themes
Dynamic form comes by default with native inputs



Import it and configure dynamic form using
`DynamicFormModule.forChild(PROVIDERS_ARRAY, THEMES, DEFAULT_THEME_NAME))`
THEMES -> Record<string, DynamicComponentMapper>
DEFAULT_THEME_NAME -> 'native' | keyof DynamicFormThemes
Ex: `DynamicFormModule.forChild([], { 'material': materialThemeComponentMapper }, 'material'))`

### Dependicies
Language Module
Translation Module
Data Module

### Available themes
1. Native Theme
All native browser inputs implemented to work inside the dynamic form. this theme is the default theme.

2. Material Theme
This Theme is built on top of the material angular lib
to add this theme first install the following lib @upupa/dynamic-form-material-theme
import it and register it with the dynamic form module `DynamicFormModule.forChild([], { 'material': materialThemeComponentMapper }, 'material'))`
this will register material theme and set it as default
`DynamicFormModule.forChild(PROVIDERS_ARRAY, THEMES, DEFAULT_THEME_NAME))`
THEMES -> Record<string, DynamicComponentMapper>
DEFAULT_THEME_NAME -> 'native' | keyof DynamicFormThemes


### Usage
.TS

.HTML
`<dynamic-form [fields]="scheme" [name]="formName" [conditions]="_conditions"></dynamic-form>`
### Fields
