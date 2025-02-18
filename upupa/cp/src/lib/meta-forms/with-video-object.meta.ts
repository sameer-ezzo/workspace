import { formInput } from "@upupa/dynamic-form";
import { VideoSchema } from "./video-object.schema";
import { SeoMetaFormViewModel } from "./with-page.meta";

export class VideoSeoMetaFormViewModel extends SeoMetaFormViewModel {
    @formInput({ input: "form", viewModel: VideoSchema, label: "Video Schema" })
    schema: VideoSchema = new VideoSchema();
}
