import { formInput, ExtendedValueChangeEvent, FieldRef, fieldRef, Fieldset } from "@upupa/dynamic-form";

/**
 * Represents an event schema model based on the structured data for events.
 * For more information, refer to the official documentation:
 * https://developers.google.com/search/docs/fundamentals/seo-starter-guide
 */

export class TwitterCardFormViewModel {
    @formInput({
        input: "text",
        label: "Title",
        placeholder: "Title of the content",
    })
    "twitter:title" = "";

    @formInput({
        input: "textarea",
        rows: 3,
        label: "Description",
        placeholder: "Short description under 170 character for SEO",
    })
    "twitter:description"!: string;

    @formInput({ input: "text", label: "Creator", placeholder: "@username" })
    "twitter:creator" = "";

    // `A URL to a unique image representing the content of the page. You should not use a generic image such as your website logo, author photo, or other image that spans multiple pages. Images for this Card support an aspect ratio of 2:1 with minimum dimensions of 300x157 or maximum of 4096x4096 pixels. Images must be less than 5MB in size. JPG, PNG, WEBP and GIF formats are supported. Only the first frame of an animated GIF will be used. SVG is not supported.
    @formInput({
        input: "text",
        label: "Image",
        placeholder: "1600x900",
    })
    "twitter:image" = "";

    @formInput({
        input: "text",
        label: "Image Alt",
    })
    "twitter:image:alt" = "";

    @formInput({ input: "text", label: "Site", placeholder: "@website" })
    "twitter:site" = "";

    @formInput({
        input: "select",
        label: "Card",
        readonly: true,
        adapter: {
            type: "client",
            displayProperty: "label",
            keyProperty: "id",
            data: [
                { id: "summary_large_image", label: "Large image summary" },
                { id: "summary", label: "Image summary" },
                { id: "app", label: "Reference to a mobile app" },
                { id: "player", label: "Video or audio player" },
            ],
        },
    })
    "twitter:card" = "summary_large_image";

    onValueChange(e: ExtendedValueChangeEvent) {
        if (e.path === "/" || e.path === "/twitter:card") {
            const value = e.value?.["twitter:card"];

            const groups = new Map<string, FieldRef>([
                ["app", fieldRef("group:App")],
                ["player", fieldRef("group:Player")],
            ]);

            for (const [group, ref] of groups) {
                if (value === group) {
                    ref.hidden.set(false);
                } else {
                    ref.hidden.set(true);
                    const items = Object.entries((ref.field as Fieldset).items);
                    for (const [name, item] of items) {
                        const itemRef = fieldRef(`/${name}`);
                        itemRef.control?.setValue(null, { emitEvent: false });
                    }
                    ref.control?.setValue(null, { emitEvent: false });
                }
            }
        }
    }

    @formInput({ input: "text", label: "App Name iPhone", group: "App", placeholder: "Awesome Task Manager" })
    "twitter:app:name:iphone" = "";
    @formInput({ input: "text", label: "App ID iPhone", group: "App", placeholder: "123456789" })
    "twitter:app:id:iphone" = "";
    @formInput({ input: "text", label: "App URL iPhone", group: "App", placeholder: "appstore://123456789" })
    "twitter:app:url:iphone" = "";
    @formInput({ input: "text", label: "App Name iPad", group: "App", placeholder: "Awesome Task Manager HD" })
    "twitter:app:name:ipad" = "";
    @formInput({ input: "text", label: "App ID iPad", group: "App", placeholder: "987654321" })
    "twitter:app:id:ipad" = "";
    @formInput({ input: "text", label: "App URL iPad", group: "App", placeholder: "appstore://987654321" })
    "twitter:app:url:ipad" = "";

    @formInput({ input: "text", label: "App Name Google Play", group: "App", placeholder: "Awesome Task Manager" })
    "twitter:app:name:googleplay" = "";
    @formInput({ input: "text", label: "App ID Google Play", group: "App", placeholder: "com.example.awesome.taskmanager" })
    "twitter:app:id:googleplay" = "";
    @formInput({ input: "text", label: "App URL Google Play", group: "App", placeholder: "android-app://com.example.awesome.taskmanager" })
    "twitter:app:url:googleplay" = "";

    @formInput({ input: "text", label: "Player", group: "Player", placeholder: "https://example.com/player.html?videoid=12345" })
    "twitter:player" = "";
    @formInput({ input: "text", label: "Player Width", group: "Player", placeholder: "1280" })
    "twitter:player:width" = "";
    @formInput({ input: "text", label: "Player Height", group: "Player", placeholder: "720" })
    "twitter:player:height" = "";
    @formInput({ input: "text", label: "Player Stream", group: "Player", placeholder: "https://example.com/stream.mp4" })
    "twitter:player:stream" = "";
    @formInput({ input: "text", label: "Player Stream Content Type", group: "Player", placeholder: "video/mp4" })
    "twitter:player:stream:content_type" = "";

    @formInput({ input: "text", label: "Player Stream Secure URL", group: "Player", placeholder: "https://example.com/stream.mp4" })
    "twitter:player:stream:secure_url" = "";
    @formInput({ input: "text", label: "Player Stream Preview Image", group: "Player", placeholder: "https://example.com/video-thumbnail.jpg" })
    "twitter:player:stream:preview_image" = "";
    @formInput({ input: "text", label: "Player Stream Preview Image Width", group: "Player", placeholder: "1280" })
    "twitter:player:stream:preview_image:width" = "";
    @formInput({ input: "text", label: "Player Stream Preview Image Height", group: "Player", placeholder: "720" })
    "twitter:player:stream:preview_image:height" = "";
}
