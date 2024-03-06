import { join } from "path";
import { env } from "process";

// Do not remove this default values because we are using then to read the real values from process.env
export class SMTPConfig {
  FROM: string | { address: string; name: string } = {
    address: env["FROM_ADDRESS"] || '',
    name: env["FROM_NAME"] || '',
  };
  SMTP_HOST: string = env["SMTP_HOST"] || '';
  SMTP_PORT: number | string = isNaN(+env["SMTP_PORT"])
    ? env["SMTP_PORT"]
    : +env["SMTP_PORT"];
  SMTP_SECURE: boolean = env["SMTP_SECURE"]?.toLocaleLowerCase() === "true";
  SMTP_AUTH_USER: string = env["SMTP_AUTH_USER"];
  SMTP_AUTH_PASS: string = env["SMTP_AUTH_PASS"];
  SMTP_DEBUG: boolean = env["SMTP_DEBUG"]?.toLocaleLowerCase() === "true";
  TEMPLATE_BASE: string = join(
    __dirname,
    env["TEMPLATE_BASE"] ?? "./views/templates/emails"
  );
}
