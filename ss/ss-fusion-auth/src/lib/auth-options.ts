

export class AuthOptions {
    clientId: string = process.env['CLIENT_ID']
    clientSecret: string = process.env['CLIENT_SECRET']

    fusionAuthURL: string = process.env['FUSION_AUTH_URL']
    fusionAuthApiBase: string = process.env['FUSION_AUTH_API_BASE']
    fusionAuthApiKey: string = process.env['FUSION_AUTH_API_KEY']


    tenantIds: string = (process.env['TENANT_ID'] || process.env['TENANT_IDS'] || '').split(',').map(x => x.trim()).join(',')

    static getErrors(options: Partial<AuthOptions>) {
        const empty = (s: string) => !s || s.trim().length === 0
        const requiredKeys: (keyof AuthOptions)[] = ['fusionAuthURL', 'fusionAuthApiBase', 'fusionAuthApiKey', 'tenantIds']
        const errors = requiredKeys.filter(k => empty(options[k])).map(k => `Fusion auth ${k} is empty`)
        return errors.length === 0 ? undefined : errors
    }
}
