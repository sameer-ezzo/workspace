/**
 * Throws an exception for the case when popover trigger doesn't have a valid popover instance
 */
export function throwPopoverMissingError() {
  throw Error(`popover-trigger: must pass in an popover instance.

    Example:
      <popover #popover="popover"></popover>
      <button [popoverTriggerFor]="popover"></button>`);
}

/**
 * Throws an exception for the case when popover's popoverPositionX value isn't valid.
 * In other words, it doesn't match 'before' or 'after'.
 */
export function throwPopoverInvalidPositionX() {
  throw Error(`popoverPositionX value must be either 'before' or after'.
      Example: <popover popoverPositionX="before" #popover="popover"></popover>`);
}

/**
 * Throws an exception for the case when popover's popoverPositionY value isn't valid.
 * In other words, it doesn't match 'above' or 'below'.
 */
export function throwPopoverInvalidPositionY() {
  throw Error(`popoverPositionY value must be either 'above' or below'.
      Example: <popover popoverPositionY="above" #popover="popover"></popover>`);
}
