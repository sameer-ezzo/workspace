import { ObjectId } from "@noah-ark/common";
import { formInput, formInputArray } from "@upupa/dynamic-form";
import { column } from "@upupa/table";
import { cloneDeep } from "lodash";
import { adapterSubmit, closeDialogOrNavigateTo } from "../adapter-submit.fun";
import { createButton } from "../buttons/create-btn.component";
import { editButton } from "../buttons/edit-btn.component";
import { deleteButton } from "../buttons/helpers";


export class NewsArticlePersonSchema {
    _id = ObjectId.generate();
    "@type" = "Person";
    @column()
    @formInput({ input: "text", placeholder: "Jane Doe" })
    name = "";

    @column()
    @formInput({ input: "text", placeholder: "https://example.com/profile/janedoe123" })
    url = "";

    @column({ header: " ", template: [editButton(NewsArticlePersonSchema, (btn) => cloneDeep(btn.item()), { updateAdapter: true }), deleteButton()] })
    actions: any;

    async onSubmit() {
        adapterSubmit(this, () => closeDialogOrNavigateTo({ submitResult: this }, [""]));
    }
}

export class NewsArticleSchema {
    "@context" = "https://schema.org";
    "@type" = "NewsArticle";
    @formInput({ input: "text", placeholder: "Title of a News Article" })
    headline = "";
    @formInput({ input: "textarea", label: "Image URLs", hint: "Comma separated list of image URLs" })
    image: string;
    @formInput({ input: "date" })
    datePublished = new Date();
    @formInput({ input: "date" })
    dateModified = new Date();

    @formInputArray(NewsArticlePersonSchema, {
        inlineEndSlot: [
            createButton(NewsArticlePersonSchema, () => new NewsArticlePersonSchema(), {
                dialogOptions: {
                    maxWidth: "625px",
                    title: "Add Author",
                },
                descriptor: { icon: "add", text: "Add Author" },
                updateAdapter: true,
            }),
        ],
    })
    author: NewsArticlePersonSchema[] = [];
}
