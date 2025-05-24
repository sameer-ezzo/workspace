import { formInput, ExtendedValueChangeEvent, FieldRef, fieldRef, Fieldset } from "@upupa/dynamic-form";

export class OpenGraphFormViewModel {
    @formInput({
        input: "text",
        label: "Title",
    })
    "og:title" = "";

    @formInput({
        input: "textarea",
        rows: 3,
        label: "Description",
    })
    "og:description" = "";

    @formInput({
        input: "text",
        label: "Image",
        placeholder: "1200x630",
    })
    "og:image" = "";

    @formInput({ input: "text", label: "Url" })
    "og:url" = "";

    @formInput({ input: "text", label: "Site Name" })
    "og:site_name" = "";

    @formInput({ input: "text", label: "Locale" })
    "og:locale" = "en_US"; //inject(LOCALE_ID, { optional: true }) ||

    //inject(LOCALE_ID, { optional: true }) ||
    @formInput({
        input: "select",
        adapter: {
            type: "client",
            displayProperty: "label",
            keyProperty: "id",
            data: [
                { id: "website", label: "Website" },
                { id: "article", label: "Article" },
                { id: "book", label: "Book" },
                { id: "profile", label: "Profile" },
                { id: "video", label: "Video" },
                { id: "music.song", label: "Music Song" },
                { id: "music.album", label: "Music Album" },
                { id: "music.playlist", label: "Music Playlist" },
                { id: "music.radio_station", label: "Music Radio Station" },
                { id: "video.movie", label: "Video Movie" },
                { id: "video.episode", label: "Video Episode" },
                { id: "video.tv_show", label: "Video TV Show" },
                { id: "video.other", label: "Video Other" },
                { id: "product", label: "Product" },
                { id: "place", label: "Place" },
                { id: "event", label: "Event" },
                { id: "restaurant.menu", label: "Restaurant Menu" },
                { id: "restaurant.menu_item", label: "Restaurant Menu Item" },
                { id: "restaurant.menu_section", label: "Restaurant Menu Section" },
                { id: "restaurant.restaurant", label: "Restaurant" },
                { id: "game.achievement", label: "Game Achievement" },
            ],
        },
        label: "Type",
    })
    "og:type" = "website";

    onValueChange(e: ExtendedValueChangeEvent) {
        if (e.path === "/" || e.path === "/og:type") {
            const value = e.value?.["og:type"];

            const groups = new Map<string, FieldRef>([
                ["article", fieldRef("group:Article")],
                ["book", fieldRef("group:Book")],
                ["profile", fieldRef("group:Profile")],
                ["music", fieldRef("group:Music")],
                ["video", fieldRef("group:Video")],
                ["product", fieldRef("group:Product")],
                ["place", fieldRef("group:Place")],
                ["event", fieldRef("group:Event")],
            ]);

            for (const [group, ref] of groups) {
                if (value === group) {
                    ref.setVisibility(true);
                } else {
                    ref.setVisibility(false);
                }
            }
        }
    }

    // if article =>  article:published_time, article:author, and article:tag
    @formInput({ input: "date", group: { name: "Article", hidden: true }, label: "Article Published Time" })
    "article:published_time": Date | undefined;
    @formInput({ input: "text", group: "Article", label: "Article Author" })
    "article:author" = "";
    @formInput({ input: "text", group: "Article", label: "Article Tag" })
    "article:tag" = "";

    // if book => book:author, book:isbn, book:release_date
    @formInput({ input: "text", group: { name: "Book", hidden: true }, label: "Book Author" })
    "book:author" = "";
    @formInput({ input: "text", group: "Book", label: "Book ISBN" })
    "book:isbn" = "";
    @formInput({ input: "date", group: "Book", label: "Book Release Date" })
    "book:release_date": Date | undefined = undefined;

    // if profile => profile:first_name, profile:last_name, profile:username
    @formInput({ input: "text", group: { name: "Profile", hidden: true }, label: "Profile First Name" })
    "profile:first_name" = "";
    @formInput({ input: "text", group: "Profile", label: "Profile Last Name" })
    "profile:last_name" = "";
    @formInput({ input: "text", group: "Profile", label: "Profile Username" })
    "profile:username" = "";

    // if music.song => music:duration and music:album
    @formInput({ input: "text", group: { name: "Music", hidden: true }, label: "Music Duration" })
    "music:duration" = "";
    @formInput({ input: "text", group: "Music", label: "Music Album" })
    "music:album" = "";

    // if music.album => music:song
    // if music.playlist => music:song
    @formInput({ input: "text", group: "Music", label: "Music Song" })
    "music:song" = "";

    // if movie => video:actor, video:writer, video:duration, video:release_date
    @formInput({ input: "text", group: { name: "Video", hidden: true }, label: "Video Actor" })
    "video:actor" = "";
    @formInput({ input: "text", group: "Video", label: "Video Writer" })
    "video:writer" = "";
    @formInput({ input: "text", group: "Video", label: "Video Duration" })
    "video:duration" = "";
    @formInput({ input: "date", group: "Video", label: "Video Release Date" })
    "video:release_date": Date | undefined;
    // if video.episode => video:series, video:actor, and video:director
    @formInput({ input: "text", group: "Video", label: "Video Series" })
    "video:series" = "";
    @formInput({ input: "text", group: "Video", label: "Video Director" })
    "video:director" = "";

    // if product => product:price:amount, product:price:currency
    @formInput({ input: "text", group: { name: "Product", hidden: true }, label: "Product Price Amount" })
    "product:price:amount" = "";
    @formInput({ input: "text", group: "Product", label: "Product Price Currency" })
    "product:price:currency" = "";

    // if place => place:location:latitude, place:location:longitude
    @formInput({ input: "text", group: { name: "Place", hidden: true }, label: "Place Location Latitude" })
    "place:location:latitude" = "";
    @formInput({ input: "text", group: "Place", label: "Place Location Longitude" })
    "place:location:longitude" = "";

    // if event => event:start_time, event:end_time, event:location
    @formInput({ input: "date", group: { name: "Event", hidden: true }, label: "Event Start Time" })
    "event:start_time": Date | undefined;
    @formInput({ input: "date", group: "Event", label: "Event End Time" })
    "event:end_time": Date | undefined;
    @formInput({ input: "text", group: "Event", label: "Event Location" })
    "event:location" = "";
}
