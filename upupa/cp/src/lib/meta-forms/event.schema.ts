/**
 * Represents an event schema model based on the structured data for events.
 * For more information, refer to the official documentation:
 * https://developers.google.com/search/docs/appearance/structured-data/event
 */
import { formInput } from "@upupa/dynamic-form";

export class EventPerformer {
    "@type" = "PerformingGroup";
    @formInput({ input: "text", placeholder: "Kira and Morrison" })
    name = "";
}

export class EventOffers {
    "@type" = "Offer";
    @formInput({ input: "text", placeholder: "https://www.example.com/event_offer/12345_202403180430" })
    url = "";
    @formInput({ input: "text", placeholder: "30" })
    price: string;
    @formInput({ input: "text", placeholder: "USD" })
    priceCurrency: string;

    @formInput({
        input: "select",
        adapter: {
            type: "client",
            data: [
                { value: "https://schema.org/InStock", label: "In Stock" },
                { value: "https://schema.org/SoldOut", label: "Sold Out" },
                { value: "https://schema.org/PreOrder", label: "Pre Order" },
                { value: "https://schema.org/PreSale", label: "Pre Sale" },
                { value: "https://schema.org/Discontinued", label: "Discontinued" },
            ],
            keyProperty: "value",
            valueProperty: "value",
            displayProperty: "label",
        },
    })
    availability = "https://schema.org/InStock";

    @formInput({ input: "date" })
    validFrom: Date;
}
export class LocationAddress {
    "@type" = "PostalAddress";
    @formInput({ input: "text", placeholder: "100 West Snickerpark Dr" })
    streetAddress = "";
    @formInput({ input: "text", placeholder: "Snickertown" })
    addressLocality = "";
    @formInput({ input: "text", placeholder: "19019" })
    postalCode = "";
    @formInput({ input: "text", placeholder: "PA" })
    addressRegion = "";
    @formInput({ input: "text", placeholder: "US" })
    addressCountry = "";
}
export class EventLocation {
    "@type" = "Place";

    @formInput({ input: "text", placeholder: "Snickerpark Stadium" })
    nam = "";
    @formInput({ input: "form", viewModel: LocationAddress })
    address: LocationAddress = new LocationAddress();
}
export class EventOrganizer {
    "@type" = "Organization";
    @formInput({ input: "text", placeholder: "Kira and Morrison Music" })
    name = "";
    @formInput({ input: "text", placeholder: "https://kiraandmorrisonmusic.com" })
    url = "";
}
export class EventObjectSchema {
    "@context" = "https://schema.org";
    "@type" = "Event";
    @formInput({ input: "text" })
    name = "";
    @formInput({ input: "date" })
    startDate: Date;
    @formInput({ input: "date" })
    endDate: Date;

    @formInput({
        input: "select",
        adapter: {
            type: "client",
            data: [
                { value: "https://schema.org/OfflineEventAttendanceMode", label: "Offline (physical location)" },
                { value: "https://schema.org/OnlineEventAttendanceMode", label: "Online" },
                { value: "https://schema.org/MixedEventAttendanceMode", label: "Mixed" },
            ],
            keyProperty: "value",
            valueProperty: "value",
            displayProperty: "label",
        },
    })
    eventAttendanceMode = "https://schema.org/OfflineEventAttendanceMode";
    eventStatus = "https://schema.org/EventScheduled";

    @formInput({ input: "form", viewModel: EventLocation, label: "Location" })
    location = new EventLocation();

    @formInput({ input: "textarea", rows: 8, label: "Image", hint: "Comma separated list of image urls" })
    image: string;

    @formInput({ input: "textarea", rows: 3, label: "Description", placeholder: "The Adventures of Kira and Morrison is coming to Snickertown in a can't miss performance." })
    description: string;

    @formInput({ input: "text", label: "Venue", placeholder: "Enter the venue name for the event" })
    venue: string;

    @formInput({ input: "form", viewModel: EventOffers, label: "Offers" })
    offers = new EventOffers();

    @formInput({ input: "form", viewModel: EventPerformer, label: "Performer" })
    performer = new EventPerformer();

    @formInput({ input: "form", viewModel: EventOrganizer, label: "Organizer" })
    organizer = new EventOrganizer();
}


