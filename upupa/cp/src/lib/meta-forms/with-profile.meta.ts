import { formInput } from "@upupa/dynamic-form";
import { ProfilePage } from "./profile.schema";
import { SeoMetaFormViewModel } from "./with-page.meta";

export class ProfileSeoMetaFormViewModel extends SeoMetaFormViewModel {
    @formInput({ input: "form", viewModel: ProfilePage, label: "Profile Schema" })
    schema: ProfilePage = new ProfilePage();
}
