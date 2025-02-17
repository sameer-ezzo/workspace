import { formInput } from "@upupa/dynamic-form";
import { NewsArticleSchema } from "./news-article.schema";
import { SeoMetaFormViewModel } from "./with-page.meta";

export class NewsArticleSeoMetaFormViewModel extends SeoMetaFormViewModel {
    @formInput({ input: "form", viewModel: NewsArticleSchema, label: "Schema org" })
    schema: NewsArticleSchema = new NewsArticleSchema();
}
