/*
This SsFactory is and override over the official NestFactoryStatic because I altered the way 
moduleTokenFactory creates a token (id) for modules and make it base the generation only on 
module type and not the module metadata
https://github.com/nestjs/nest/blob/a60491d9bc2fbe97cf624598ef62891688842e7f/packages/core/injector/module-token-factory.ts#L18

This alternation is for the purpose of making StaticTypeModule and it's DynamicModule version has the same token
and therefore instance-loader won't load the module twice
*/


import { DynamicModule, INestApplication, INestApplicationContext, INestMicroservice, NestApplicationOptions, Type } from "@nestjs/common"
import { NestMicroserviceOptions } from "@nestjs/common/interfaces/microservices/nest-microservice-options.interface"
import { NestApplicationContextOptions } from "@nestjs/common/interfaces/nest-application-context-options.interface"
import { AbstractHttpAdapter, ApplicationConfig, NestContainer, NestApplication, GraphInspector, NestApplicationContext } from "@nestjs/core"
import { NestFactoryStatic } from "@nestjs/core/nest-factory"
import { NestMicroservice } from "@nestjs/microservices"
import hash from 'object-hash'




export const SsFactory = new NestFactoryStatic()
const _SsFactory = SsFactory as any




function _container(applicationConfig?: ApplicationConfig): NestContainer {
    const container = new NestContainer(applicationConfig)
    const moduleTokenFactory = container['moduleTokenFactory']
    moduleTokenFactory.create = function create(
        metatype: Type<unknown>,
        dynamicModuleMetadata?: Partial<DynamicModule> | undefined,
    ): string {
        const moduleId = moduleTokenFactory.getModuleId(metatype)
        const opaqueToken = {
            id: moduleId,
            module: moduleTokenFactory.getModuleName(metatype),
            //dynamic: moduleTokenFactory.getDynamicMetadataToken(dynamicModuleMetadata),
        };
        return hash(opaqueToken, { ignoreUnknown: true })
    }

    return container;
}


_SsFactory.create = async function create<T extends INestApplication = INestApplication>(
    module: any,
    serverOrOptions?: AbstractHttpAdapter | NestApplicationOptions,
    options?: NestApplicationOptions,
): Promise<T> {

    const [httpServer, appOptions] = _SsFactory.isHttpServer(serverOrOptions)
        ? [serverOrOptions, options]
        : [this.createHttpAdapter(), serverOrOptions]

    const applicationConfig = new ApplicationConfig()
    const container = _container(applicationConfig)
    const graphInspector = this.createGraphInspector(appOptions, container);

    this.setAbortOnError(serverOrOptions, options)
    this.registerLoggerConfiguration(appOptions)

    await this.initialize(
        module,
        container,
        graphInspector,
        applicationConfig,
        appOptions,
        httpServer)

    const instance = new NestApplication(
        container,
        httpServer,
        applicationConfig,
        graphInspector,
        appOptions as any
    );
    const target = this.createNestInstance(instance)
    return _SsFactory.createAdapterProxy(target, httpServer)
}


SsFactory.createMicroservice = async function createMicroservice<T extends object>(
    module: any,
    options?: NestMicroserviceOptions & T,
): Promise<INestMicroservice> {

    const applicationConfig = new ApplicationConfig()
    const container = _container(applicationConfig)
    _SsFactory.setAbortOnError(options)
    _SsFactory.registerLoggerConfiguration(options)

    await _SsFactory.initialize(module, container, applicationConfig)
    const gi = createGraphInspector(options, container)
    return _SsFactory.createNestInstance(
        new NestMicroservice(container, options ?? {}, gi, applicationConfig),
    );

}


const noop = () => { };
export const NoopGraphInspector: GraphInspector = new Proxy(
    GraphInspector.prototype,
    {
        get: () => noop,
    },
);

function createGraphInspector(
    appOptions: NestApplicationContextOptions,
    container: NestContainer,
) {
    return appOptions?.snapshot
        ? new GraphInspector(container)
        : NoopGraphInspector;
}

SsFactory.createApplicationContext = async function createApplicationContext(
    module: any,
    options?: NestApplicationContextOptions,
): Promise<INestApplicationContext> {
    const container = _container()
    _SsFactory.setAbortOnError(options)
    _SsFactory.registerLoggerConfiguration(options)

    await _SsFactory.initialize(module, container)

    const modules = container.getModules().values()
    const root = modules.next().value;

    const context = _SsFactory.createNestInstance(
        new NestApplicationContext(container, options, root, []),
    );
    return context.init()
}