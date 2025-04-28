import { formInput } from "@upupa/dynamic-form";

export class MainEntity {
    "@type": "Person";
    @formInput({ input: "text", placeholder: "Angelo Huff" })
    "name": "";
    @formInput({ input: "text", placeholder: "ahuff23" })
    "alternateName" = null;
    @formInput({ input: "text", placeholder: "123475623" })
    "identifier" = null;

    // "interactionStatistic": [
    //     {
    //         "@type": "InteractionCounter";
    //         interactionType: "https://schema.org/FollowAction";
    //         userInteractionCount: 1;
    //     },
    //     {
    //         "@type": "InteractionCounter";
    //         interactionType: "https://schema.org/LikeAction";
    //         userInteractionCount: 5;
    //     },
    // ];
    // "agentInteractionStatistic": {
    //     "@type": "InteractionCounter";
    //     interactionType: "https://schema.org/WriteAction";
    //     userInteractionCount: 2346;
    // };
    @formInput({ input: "text", placeholder: "Defender of Truth" })
    "description" = "";

    @formInput({ input: "text", placeholder: "https://example.com/avatars/ahuff23.jpg" })
    "image": "https://example.com/avatars/ahuff23.jpg";

    @formInput({ input: "text", placeholder: "https://www.example.com/real-angelo, https://example.com/profile/therealangelohuff" })
    "sameAs" = null;
}
export class ProfilePage {
    "@context": "https://schema.org";
    "@type": "ProfilePage";
    @formInput({ input: "date" })
    dateCreated: Date = new Date();
    dateModified: Date | null = new Date();

    @formInput({ input: "form", viewModel: MainEntity })
    mainEntity: MainEntity = new MainEntity();
}
