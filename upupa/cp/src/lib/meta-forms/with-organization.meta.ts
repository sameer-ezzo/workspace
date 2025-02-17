import { formInput } from "@upupa/dynamic-form";
import { OrganizationSchema } from "./organization.schema";
import { SeoMetaFormViewModel } from "./with-page.meta";


export class OrganizationSeoMetaFormViewModel extends SeoMetaFormViewModel {
    @formInput({ input: "form", viewModel: OrganizationSchema, label: "Organization Schema" })
    schema: OrganizationSchema = new OrganizationSchema();
}
