import { EnvironmentInjector } from "@angular/core";
import { ContentNode } from "./content-node";
import { createContentNode } from "./with-content-projection";


export function createContentNodes(content: ContentNode[][], environmentInjector: EnvironmentInjector): Node[][] {
    if (!content) return [];
    return content.map((projectedContents) => projectedContents.map((content) => createContentNode(content, environmentInjector)));
}
