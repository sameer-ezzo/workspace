import { formInput } from "@upupa/dynamic-form";
import { TwitterCardFormViewModel } from "./twitter-card-form";
import { OpenGraphFormViewModel } from "./open-graph.form";

export class SeoMetaFormViewModel {
    @formInput({
        input: "text",
        label: "Title",
        
    })
    title = "";

    @formInput({
        input: "textarea",
        rows: 3,
        placeholder: "Short description under 170 character for SEO",
    })
    description!: string;

    @formInput({ input: "textarea", rows: 3, label: "Keywords" })
    keywords!: string;

    @formInput({ input: "text", label: "Author" })
    author!: string;

    @formInput({ input: "text", label: "Canonical Url" })
    canonicalUrl!: string;

    @formInput({ input: "text", label: "Image" })
    image!: string;

    @formInput({ input: "form", inputs: { viewModel: TwitterCardFormViewModel }, label: "Twitter Card" })
    twitter: TwitterCardFormViewModel = new TwitterCardFormViewModel();

    @formInput({ input: "form", inputs: { viewModel: OpenGraphFormViewModel }, label: "Open Graph Meta" })
    og: OpenGraphFormViewModel = new OpenGraphFormViewModel();
}
