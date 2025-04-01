import { formInput, formInputArray } from "@upupa/dynamic-form";
import { column } from "@upupa/table";
import { createButton } from "../buttons/form-dialog-btn.component";

/**
 * Represents video schema model based on the structured data for Videos.
 * For more information, refer to the official documentation:
 * https://developers.google.com/search/docs/appearance/structured-data/video
 */

export class InteractionStatistic {
    "@type" = "InteractionCounter";
    interactionType = { "@type": "WatchAction" };
    userInteractionCount: number | undefined = undefined;
}

export class Publication {
    "@type" = "BroadcastEvent";
    @column()
    @formInput({ input: "switch", template: "checkbox" })
    isLiveBroadcast = false;

    @column()
    @formInput({ input: "date" })
    startDate = new Date();

    @column()
    @formInput({ input: "date" })
    endDate = new Date();
}

export class VideoPart {
    "@type" = "Clip";
    @column()
    @formInput({ input: "text", placeholder: "Cat jumps" })
    name = "";

    @column()
    @formInput({ input: "number", placeholder: "30" })
    startOffset = 0;

    @column()
    @formInput({ input: "number", placeholder: "45" })
    endOffset = 0;

    @column()
    @formInput({ input: "text", placeholder: "https://www.example.com/example?t=30" })
    url = "";
}

export class VideoSchema {
    "@context" = "https://schema.org";
    "@type" = "VideoObject";

    @formInput({ input: "text", placeholder: "Introducing the self-driving bicycle in the Netherlands" })
    name = "";

    @formInput({
        input: "textarea",
        rows: 5,
        placeholder:
            "This spring, Google is introducing the self-driving bicycle in Amsterdam, the world's premier cycling city. The Dutch cycle more than any other nation in the world, almost 900 kilometres per year per person, amounting to over 15 billion kilometres annually. The self-driving bicycle enables safe navigation through the city for Amsterdam residents, and furthers Google's ambition to improve urban mobility with technology. Google Netherlands takes enormous pride in the fact that a Dutch team worked on this innovation that will have great impact in their home country.",
    })
    description = "";

    @formInput({ input: "text", placeholder: "https://example.com/photos/1x1/photo.jpg, https://example.com/photos/4x3/photo.jpg" })
    thumbnailUrl = "";

    @formInput({ input: "date" })
    uploadDate = new Date();
    @formInput({ input: "text", placeholder: "PT00H30M5S", hint: "PT00H30M5S represents a duration of 'thirty minutes and five seconds'." })
    duration = "";
    @formInput({ input: "text", placeholder: "https://www.example.com/video/123/file.mp4" })
    contentUrl = "";

    @formInput({
        input: "text",
        placeholder: "https://www.example.com/embed/123",
        hint: "A URL pointing to a player for the specific video. Don't link to the page where the video lives; this must be the URL of the video player itself. Usually this is the information in the src attribute of an <embed> element.",
    })
    embedUrl = "";

    @formInput({
        input: "text",
        placeholder: "US, NL",
        hint: "The regions where the video is allowed, if applicable. If not specified, then Google assumes the video is allowed everywhere.",
    })
    regionsAllowed = "";

    @formInput({
        input: "text",
        placeholder: "DE, FR",
        hint: "The region where the video isn't allowed, if applicable. If not specified, then Google assumes the video is allowed everywhere.",
    })
    ineligibleRegion = "";

    @formInputArray(Publication, {
        inlineEndSlot: [
            createButton(Publication, () => new Publication(), {
                dialogOptions: {
                    maxWidth: "625px",
                    title: "Add Publication",
                },
                descriptor: { icon: "add", text: "Add Publication" },
                updateAdapter: true,
            }),
        ],
    })
    publication = [];

    @formInputArray(
        VideoPart,
        {
            inlineEndSlot: [
                createButton(VideoPart, () => new VideoPart(), {
                    dialogOptions: {
                        maxWidth: "625px",
                        title: "Add Video Part",
                    },
                    descriptor: { icon: "add", text: "Add Part" },
                    updateAdapter: true,
                }),
            ],
        },
        { label: "Video Parts" },
    )
    hasPart = [];

    // SeekToAction
}
