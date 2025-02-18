import { formInput, formInputArray } from "@upupa/dynamic-form";

// https://developers.google.com/search/docs/appearance/structured-data/book

export class BookSchema {
    "@context" = "https://schema.org";
    "@type" = "DataFeed";
    dataFeedElement = [];
    dateModified = new Date();
}

export class BookAuthor {
    "@type" = "Person";
    @formInput({ input: "text", placeholder: "J.D. Salinger" })
    name = "";
}

export class BookWorkExampleIdentifier {
    "@type" = "PropertyValue";
    @formInput({ input: "text", placeholder: "OCLC_NUMBER" })
    propertyID = "";
    @formInput({ input: "text", placeholder: "1057320822" })
    value = "";
}

export class PotentialActionTarget {
    "@type" = "EntryPoint";
    @formInput({ input: "text", placeholder: "https://example.com/store/9787543321724" })
    urlTemplate = "";
    @formInput({
        input: "select",
        adapter: {
            type: "client",
            data: [
                { value: "https://schema.org/DesktopWebPlatform", label: "Desktop Web Platform" },
                { value: "https://schema.org/AndroidPlatform", label: "Android Platform" },
                { value: "https://schema.org/IOSPlatform", label: "IOS Platform" },
            ],
            keyProperty: "value",
            valueProperty: "value",
            displayProperty: "label",
        },
    })
    actionPlatform: string[] = ["https://schema.org/DesktopWebPlatform", "https://schema.org/AndroidPlatform", "https://schema.org/IOSPlatform"];
}

export class PotentialActionTargetExpectsAcceptanceOfEligibleRegion {
    "@type" = "Country";
    @formInput({ input: "text", placeholder: "US" })
    name = "";
}
export class PotentialActionTargetExpectsAcceptanceOf {
    "@type" = "Offer";

    @formInput({ input: "text", placeholder: "purchase" })
    category = "";
    @formInput({ input: "text", placeholder: "6.99" })
    price = "";
    @formInput({ input: "text", placeholder: "USD" })
    priceCurrency = "";
    @formInput({ input: "date" })
    availabilityStarts = new Date();
    @formInput({ input: "date" })
    availabilityEnds = new Date();

    @formInput({ input: "form", viewModel: PotentialActionTargetExpectsAcceptanceOfEligibleRegion })
    eligibleRegion: PotentialActionTargetExpectsAcceptanceOfEligibleRegion = new PotentialActionTargetExpectsAcceptanceOfEligibleRegion();
}

export class BookWorkExamplePotentialAction {
    @formInput({
        input: "select",
        adapter: { type: "client", data: [{ value: "ReadAction", label: "Read Action" }], keyProperty: "value", valueProperty: "value", displayProperty: "label" },
    })
    "@type" = "ReadAction";

    @formInput({ input: "form", viewModel: PotentialActionTarget })
    target: PotentialActionTarget = new PotentialActionTarget();

    @formInput({ input: "form", viewModel: PotentialActionTargetExpectsAcceptanceOf })
    expectsAcceptanceOf: PotentialActionTargetExpectsAcceptanceOf = new PotentialActionTargetExpectsAcceptanceOf();
}
export class BookWorkExample {
    "@type" = "Book";
    @formInput({ input: "text", placeholder: "https://example.com/edition/the_catcher_in_the_rye_paperback" })
    "@id" = "";
    @formInput({ input: "text", placeholder: "9787543321724" })
    isbn = "";
    @formInput({ input: "text", placeholder: "Mass Market Paperback" })
    bookEdition = "";
    @formInput({ input: "text", placeholder: "https://schema.org/Paperback" })
    bookFormat = "";
    @formInput({ input: "text", placeholder: "en" })
    inLanguage = "";
    @formInput({ input: "text", placeholder: "https://example.com/edition/the_catcher_in_the_rye_paperback" })
    url = "";
    @formInput({ input: "text", placeholder: "1991-05-01" })
    datePublished = new Date();

    @formInput({ input: "form", viewModel: BookWorkExampleIdentifier })
    identifier: BookWorkExampleIdentifier = new BookWorkExampleIdentifier();

    @formInput({ input: "form", viewModel: BookWorkExamplePotentialAction })
    potentialAction: BookWorkExamplePotentialAction = new BookWorkExamplePotentialAction();
}

export class BookFeed {
    "@context" = "https://schema.org";
    "@type" = "Book";
    @formInput({ input: "text", placeholder: "https://example.com/work/the_catcher_in_the_rye" })
    "@id" = "";
    @formInput({ input: "text", placeholder: "https://example.com/work/the_catcher_in_the_rye" })
    url = "";
    @formInput({ input: "text", placeholder: "The Catcher in the Rye" })
    name = "";

    author: BookAuthor = new BookAuthor();
    @formInput({ input: "text", placeholder: "https://en.wikipedia.org/wiki/The_Catcher_in_the_Rye" })
    sameAs = "";

    @formInputArray(BookWorkExample, {
        inlineEndSlot: [],
    })
    workExample: [
        {
            "@type": "Book";
            "@id": "https://example.com/edition/the_catcher_in_the_rye_hardcover";
            isbn: "9780316769532";
            bookEdition: "Hardcover";
            bookFormat: "https://schema.org/Hardcover";
            inLanguage: "en";
            url: "https://example.com/edition/the_catcher_in_the_rye_hardcover";
            datePublished: "1951-07-16";
            potentialAction: {
                "@type": "ReadAction";
                target: {
                    "@type": "EntryPoint";
                    urlTemplate: "https://example.com/store/9780316769532";
                    actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/AndroidPlatform", "https://schema.org/IOSPlatform"];
                };
                expectsAcceptanceOf: [
                    {
                        "@type": "Offer";
                        category: "nologinrequired";
                        availabilityStarts: "2020-01-01T11:0:00-04:00";
                        availabilityEnds: "2050-06-30T23:59:00-04:00";
                        eligibleRegion: [
                            {
                                "@type": "Country";
                                name: "US";
                            },
                            {
                                "@type": "Country";
                                name: "GB";
                            },
                        ];
                    },
                    {
                        "@type": "Offer";
                        category: "Subscription";
                        availabilityStarts: "2020-01-01T11:0:00-04:00";
                        availabilityEnds: "2050-06-30T23:59:00-04:00";
                        eligibleRegion: {
                            "@type": "Country";
                            name: "IN";
                        };
                    },
                ];
            };
        },
    ];
}
