import { formInput } from "@upupa/dynamic-form";

export class OrganizationAddress {
    "@type" = "PostalAddress";
    @formInput({ input: "text", placeholder: "Rue Improbable 99" })
    streetAddress = "";

    @formInput({ input: "text", placeholder: "Paris" })
    addressLocality = "Paris";
    @formInput({ input: "text", placeholder: "FR" })
    addressCountry = "";
    @formInput({ input: "text", placeholder: "Ile-de-France" })
    addressRegion = "";
    @formInput({ input: "text", placeholder: "75001" })
    postalCode = "";
}
export class OrganizationSchema {
    "@context" = "https://schema.org";
    "@type" = "Organization";
    @formInput({ input: "text", placeholder: "https://www.example.com" })
    url: string;
    @formInput({ input: "text", placeholder: "https://example.net/profile/example1234, https://example.org/example1234", hint: "Comma separated list of profile URLs" })
    sameAs: string;

    @formInput({ input: "text", placeholder: "https://www.example.com/images/logo.png" })
    logo = "";
    @formInput({ input: "text", placeholder: "Example Corporation" })
    name = "";
    @formInput({ input: "text", placeholder: "The example corporation is well-known for producing high-quality widgets" })
    description = "";

    @formInput({ input: "text", placeholder: "contact@example.com" })
    email = "";
    @formInput({ input: "text", placeholder: "+1-877-746-0909" })
    telephone = "";
    @formInput({ input: "form", viewModel: OrganizationAddress })
    address = new OrganizationAddress();

    @formInput({ input: "text", placeholder: "FR12345678901" })
    vatID = "";
    @formInput({ input: "text", placeholder: "0199:724500PMK2A2M1SQQ228" })
    iso6523Code = "";
}


