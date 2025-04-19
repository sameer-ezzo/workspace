# Use Guidelines

## Submission
* Better to write submit logic in `submit` method in Form View Model.
* Don't write lines related to how was the form rendered. ex: don't close dialog, don't show toast, etc.
* Ideally just inject DataAdapter and call `put`, or call adapterSubmit for short.

## Form Dialog
* openFormDialog will automatically render the form and call the value in injection context.
* Keep responsibility of closing dialog in the caller, or just leave the autoCloseOnSuccess option.
* Use form-dialog-btn if you want a button to open form dialog