
import { inject, Injectable } from '@angular/core'
import { DataService } from '@upupa/data'
import { ObjectId } from '@upupa/data'
import { Observable, of } from 'rxjs'

import { map, shareReplay, switchMap, tap } from 'rxjs/operators'
import { Tag } from './tag.model'
import { LanguageService } from '@upupa/language'


@Injectable({ providedIn: 'root' })
export class TagsService {

  private readonly idTagMap: Map<string, Tag> = new Map()
  private readonly tagsMap: Map<string, Tag[]> = new Map()
  private readonly langService = inject(LanguageService)

  constructor(private dataService: DataService) {
    this.getTags().subscribe()
  }

  private readonly gettingByPath: Map<string, Observable<Tag[]>> = new Map()
  getTags(parentPath?: string): Observable<Tag[]> {

    parentPath = (parentPath || '').trim().split('/').filter(x => x.length).join('/')
    parentPath = '/' + parentPath?.split('/').filter(x => x.length).join('/')
    if (this.gettingByPath.has(parentPath)) return this.gettingByPath.get(parentPath)
    const tags = this.tagsMap.get(parentPath) ?? []
    if (tags.length) return of(tags)
    const filter = { parentPath: `${parentPath}*`, select: `_id,name,order,meta` }
    const rx = () => this.dataService.get<any>(`/v2/tag`, filter).pipe(
      map(res => res.data as Tag[]),
      map(tags => tags.map(t => ({ ...t, name: typeof t.name === 'string' ? t.name : t.name[this.langService.language ?? this.langService.defaultLang] }))),
      tap(tags => {
        this.tagsMap.set(parentPath, tags)
        tags.forEach(t => this.idTagMap.set(t._id, t))
        this.gettingByPath.delete(parentPath)
      }),
      shareReplay(1)
    )
    this.gettingByPath.set(parentPath, rx())
    return this.gettingByPath.get(parentPath)

  }


  getTagById(id: string) {
    return this.idTagMap.get(id)
  }
  getTagsByIds(ids: string[]) {
    return ids.map(id => this.getTagById(id))
  }

  getTagByName(name: string) {
    return this.tagsMap.get(name)
  }
  getTagsByNames(names: string[]) {
    return names.map(n => this.getTagByName(n))
  }


  convertNameToId(name: string) {
    return name?.trim().length > 0 ? name.split(' ').filter(s => s.length > 0).join('-') : ObjectId.generate()
  }


  private pathSegments(path: string): string[] {
    return path.split('/').map(s => s.trim()).filter(s => s.length)
  }
  async createTag(tag: Pick<Tag, '_id'> & Partial<Tag>, parentPath?: string): Promise<Tag> {
    let id = tag._id ?? ''
    if (id.trim().length === 0) throw new Error("tag id must be provided");

    id = this.convertNameToId(tag._id)
    const post = { ...tag, _id: id, name: tag.name ?? tag._id } as Tag
    parentPath = parentPath ? parentPath : (tag.parentPath ?? '/')
    post.parent = this.pathSegments(parentPath).pop()
    post.parentPath = parentPath

    try {
      await this.dataService.post(`/tag`, post)
      this.tagsMap.set(parentPath, [...(this.tagsMap.get(parentPath) ?? []), post])
      this.idTagMap.set(post._id, post)

    } catch (error) {
      console.error(error)
      // if (error.statusCode === 406)
      //   console.log("CANNOT_POST_OVER_EXISTING_DOCUMENT")
    }
    return post
  }

  async saveTag(tag: Tag, parentPath?: string): Promise<Tag> {
    const _id = this.convertNameToId(tag._id)
    const post = { ...tag } as Tag
    parentPath = parentPath ? parentPath : (tag.parentPath ?? '/')
    post.parent = this.pathSegments(parentPath).pop()
    post.parentPath = parentPath
    delete post._id

    try {
      await this.dataService.put(`/tag/${_id}`, post)
      post._id = _id
      this.tagsMap.set(parentPath, [...(this.tagsMap.get(parentPath) ?? []), post])
      this.idTagMap.set(post._id, post)
    } catch (error) {
      console.error(error)
    }
    return post
  }

  async removeTag(tag: Tag) {
    try {
      //todo: remove all children and sub children...
      await this.dataService.delete(`tag/${tag._id}`)
      // this.tagsMap.delete(data.name)
      // this.tags = Array.from(this.tagsMap)
    } catch (err) {
      console.error(err)
    }
  }
}
