import { formInput } from "@upupa/dynamic-form";
import { SeoMetaFormViewModel } from "./with-page.meta";
import { ImageObjectSchema } from "./image-object.schema";

export class ImageObjectSeoMetaFormViewModel extends SeoMetaFormViewModel {
    @formInput({ input: "form", viewModel: ImageObjectSchema, label: "Image Object Schema" })
    schema: ImageObjectSchema = new ImageObjectSchema();
}
