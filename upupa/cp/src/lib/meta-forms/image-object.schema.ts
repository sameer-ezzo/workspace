import { formInput } from "@upupa/dynamic-form";

export class SchemaAuthorForm {
    @formInput({ input: "text", readonly: true })
    "@type" = "Person";
    @formInput({ input: "text" })
    name!: string;
}

export class ImageObjectSchema {
    "@context" = "https://schema.org/";
    "@type" = "ImageObject";

    @formInput({ input: "text" })
    name!: string;

    @formInput({ input: "text" })
    contentUrl!: string;

    @formInput({ input: "textarea", rows: 3 })
    description!: string;
    @formInput({ input: "form", viewModel: SchemaAuthorForm })
    author: SchemaAuthorForm = new SchemaAuthorForm();

    @formInput({ input: "date" })
    datePublished: Date | undefined = undefined;
    @formInput({ input: "date" })
    uploadDate: Date | undefined = undefined;
    @formInput({
        input: "select",
        adapter: {
            type: "client",
            data: [
                {
                    value: "https://creativecommons.org/licenses/by/4.0/",
                    label: "Allows others to copy, distribute, remix, adapt, and build upon your work, even commercially, as long as they credit you appropriately.",
                },
                {
                    value: "https://creativecommons.org/licenses/by-nd/4.0/",
                    label: "Allows redistribution, commercial and non-commercial, as long as the image is not modified and credit is provided.",
                },
                {
                    value: "https://en.wikipedia.org/wiki/All_rights_reserved",
                    label: "All rights reserved. No use is allowed without explicit permission.",
                },
                {
                    value: "https://creativecommons.org/publicdomain/zero/1.0/",
                    label: "Public Domain Dedication. No rights reserved, and no attribution required (not recommended for your case).",
                },
            ],
            keyProperty: "value",
            displayProperty: "label",
        },
    })
    license = "https://creativecommons.org/licenses/by/4.0/";

    @formInput({ input: "number" })
    width = 1200;
    @formInput({ input: "number" })
    height = 630;
}