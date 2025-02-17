import { formInput } from "@upupa/dynamic-form";
import { EventObjectSchema } from "./event.schema";
import { SeoMetaFormViewModel } from "./with-page.meta";


export class EventSeoMetaFormViewModel extends SeoMetaFormViewModel {
    @formInput({ input: "form", viewModel: EventObjectSchema })
    schema = new EventObjectSchema();
}
