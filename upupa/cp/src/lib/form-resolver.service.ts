import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PathInfo } from '@noah-ark/path-matcher';
import { ScaffoldingService } from './scaffolding.service';


@Injectable({ providedIn: 'root' })
export class DataFormResolverService {
    constructor(public scaffolder: ScaffoldingService) {}

    resolve(snapshot: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.scaffolder.scaffold(PathInfo.toPath(snapshot.url.map(s => s.path))) as any;
    }
}
