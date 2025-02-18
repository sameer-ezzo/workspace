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

    // if article =>  article:published_time, article:author, and article:tag
    @formInput({ input: "date", group: "Article", label: "Article Published Time", hidden: true })
    "article:published_time": Date | undefined;
    @formInput({ input: "text", group: "Article", label: "Article Author", hidden: true })
    "article:author" = "";
    @formInput({ input: "text", group: "Article", label: "Article Tag", hidden: true })
    "article:tag" = "";

    // if book => book:author, book:isbn, book:release_date
    @formInput({ input: "text", group: "Book", label: "Book Author", hidden: true })
    "book:author" = "";
    @formInput({ input: "text", group: "Book", label: "Book ISBN", hidden: true })
    "book:isbn" = "";
    @formInput({ input: "date", group: "Book", label: "Book Release Date", hidden: true })
    "book:release_date": Date | undefined = undefined;

    // if profile => profile:first_name, profile:last_name, profile:username
    @formInput({ input: "text", group: "Profile", label: "Profile First Name", hidden: true })
    "profile:first_name" = "";
    @formInput({ input: "text", group: "Profile", label: "Profile Last Name", hidden: true })
    "profile:last_name" = "";
    @formInput({ input: "text", group: "Profile", label: "Profile Username", hidden: true })
    "profile:username" = "";

    // if music.song => music:duration and music:album
    @formInput({ input: "text", group: "Music", label: "Music Duration", hidden: true })
    "music:duration" = "";
    @formInput({ input: "text", group: "Music", label: "Music Album", hidden: true })
    "music:album" = "";

    // if music.album => music:song
    // if music.playlist => music:song
    @formInput({ input: "text", group: "Music", label: "Music Song", hidden: true })
    "music:song" = "";

    // if movie => video:actor, video:writer, video:duration, video:release_date
    @formInput({ input: "text", group: "Video", label: "Video Actor", hidden: true })
    "video:actor" = "";
    @formInput({ input: "text", group: "Video", label: "Video Writer", hidden: true })
    "video:writer" = "";
    @formInput({ input: "text", group: "Video", label: "Video Duration", hidden: true })
    "video:duration" = "";
    @formInput({ input: "date", group: "Video", label: "Video Release Date", hidden: true })
    "video:release_date": Date | undefined;
    // if video.episode => video:series, video:actor, and video:director
    @formInput({ input: "text", group: "Video", label: "Video Series", hidden: true })
    "video:series" = "";
    @formInput({ input: "text", group: "Video", label: "Video Director", hidden: true })
    "video:director" = "";

    // if product => product:price:amount, product:price:currency
    @formInput({ input: "text", group: "Product", label: "Product Price Amount", hidden: true })
    "product:price:amount" = "";
    @formInput({ input: "text", group: "Product", label: "Product Price Currency", hidden: true })
    "product:price:currency" = "";

    // if place => place:location:latitude, place:location:longitude
    @formInput({ input: "text", group: "Place", label: "Place Location Latitude", hidden: true })
    "place:location:latitude" = "";
    @formInput({ input: "text", group: "Place", label: "Place Location Longitude", hidden: true })
    "place:location:longitude" = "";

    // if event => event:start_time, event:end_time, event:location
    @formInput({ input: "date", group: "Event", label: "Event Start Time", hidden: true })
    "event:start_time": Date | undefined;
    @formInput({ input: "date", group: "Event", label: "Event End Time", hidden: true })
    "event:end_time": Date | undefined;
    @formInput({ input: "text", group: "Event", label: "Event Location", hidden: true })
    "event:location" = "";
}
