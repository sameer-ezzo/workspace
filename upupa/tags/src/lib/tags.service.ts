
import { Injectable } from '@angular/core'
import { DataService } from '@upupa/data'
import { ObjectId } from '@upupa/data'
import { Observable, of } from 'rxjs'

import { map, shareReplay, switchMap, tap } from 'rxjs/operators'
import { Tag } from './tag.model'


@Injectable({ providedIn: 'root' })
export class TagsService {

  private readonly idTtagMap: Map<string, Tag> = new Map()
  private readonly tagsMap: Map<string, Tag[]> = new Map()

  constructor(private dataService: DataService) { }

  getTags(parentPath?: string): Observable<Tag[]> {
    const filter = {}
    parentPath = '/' + parentPath?.split('/').filter(x => x.length).join('/')
    const tags = this.tagsMap.get(parentPath)
    if (tags?.length) return of(tags)
    filter['parentPath'] = `${parentPath}*`
    return this.dataService.get<any>(`/v2/tag`, filter).pipe(
      map(res => res.data as Tag[]),
      tap(tags => {
        this.tagsMap.set(parentPath, tags)
        tags.forEach(t => this.idTtagMap.set(t._id, t))
      })
    )
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
      this.idTtagMap.set(post._id, post)

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
      this.idTtagMap.set(post._id, post)
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
