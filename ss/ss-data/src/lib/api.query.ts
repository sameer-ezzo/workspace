// https://github.com/surfer77/mongoose-string-query

import { ObjectId } from "mongodb";
import { logger } from "./logger";
import { Model } from "mongoose";

// */
const operatorPattern = /^\{(\S+)\}(.*)/;
type SpreadDate = [number, number, number, number, number, number, number];

/*
//FILTERING (WHERE)
## SYNTAX:
?field1=expression1&field2=expression2|field3=expression3 WHERE & is AND , | is OR WHERE expression={operator}value
## Types of {operator}
General operators: {eq},{exists}, {ne} = exists means it's not null, ne is not equal
Number/Date operators: {gte},{gt},{lte},{lt} = greater_that_or_equal , greater_that ...
Date operators: {year},{month},{date},{hour},{minute},{second} ex: birthDate={yeah}1987
Array operators: {in},{all},{nin} = in array ex: tags={in}red , all in array , not in array
## Value type
values will be automatically converted to corresponding types
'true' => true
'DATE_ZOLU_FORMAT' => Date()
'some*text' => REGEX
'true:false:A' => [true,false,'A']
'9' => 9
'null' => null
'undefined' => undefined
-- Note:
If {operator} is not provided it's considered as {eq} but value conversion for number,array won't happen ex: model=9 will not convert 9 to number it will be treated as '9'
*/

/*
//SORT
## SYNTAX:
?sort_by=field,[asc|desc]?
Sorting can be performed by only one field, direction is ascending by default
*/

/*
//LOOKUP (JOIN)
SYNTAX: ?lookup=lookup1;lookup2 WHERE: lookup1=collection:foreignField:localField:as:[unwind]
* collection is the name of the collection that you want to lookup
* foreignField is the name of the field to match to inside the other collection
* localField is the name of the field to match to inside the current collection
* as is the name of the resulted data to be added as an array field to the current result
* unwind (optional) if provided the as field will be converted from array to object by getting the first element (this is useful for one-to-one joins)
Example:  /blogs?lookup=tag:name:category:categoryInfo:unwind,tag:name:tags:tagsInfo
This will add 2 fields to the resulted 'blogs' the first field is called 'categoryInfo' containing the 'tag' object that is matched from 'tag' collection where tag.name=blog.category, and it's an object because of the 'unwind' operator passed ar the end.
The second field is called 'tagsInfo' which is an array of 'tag' objects matched from 'tag' collection where tag.name=blog.tags*
This example shows the use of multiple lookups one demonstrating one-to-one association blog(1)<-[category]->(1)tag and the other demonstrating one-to-many association blog(1)<-[tags]->(*)tag.
*/

/*
//INCLUDING FIELDS (SELECT)
## SYNTAX:
?select=field1,!field2,field2

The simple select operator will include only fields specified.
This fields inclusion is performed after filtering/sorting so filtering/sorting can be performed on fields event when not selected.
The field2 in this case is told to be excluded.
*/

/*
//ADDING CALCULATED FIELDS (SELECT AS)
## SYNTAX:
?fields1=as1={operator}expression1,as2={operator}expression2

The fields1 (and fields2, fields3) are meant to add a calculated field ex: price=unit*quantity  => fields1=price={mul}$unit:$quantity. The fields1,fields2 and fields3 are executed sequentialy, so they are usefull to introduce calculated depending on other calculated fields.
Ex: math_mark=lab_mark+test_mark then total_marks=math_mark+computer_mark
This can be writter as:
?fields1=math_mark={add}$lab_mark:$test_mark&fields2=total_marks={add}$math_mark:$computer_mark
Notes:
* {operator} could any accepted mongo operator like {add},{sub},{mul} ...
* The : is the array operatos so $lab_mark:$test_mark => [$lab_mark,$test_mark]
https://docs.mongodb.com/manual/meta/aggregation-quick-reference/#aggregation-expressions
*/

//PAGINATION (SKIP,TAKE)
/*
## SYNTAX:
?page=x&per_page=y WHERE 'per_page' by default is the max value 100
Pagination comes as the last operator in the pipeline limiting the results after the filter and sort.
## Pagination and Grouping
In general limiting results come as the last operation but in the case of grouping the limit is applied before. Meaning the results won't necessarly contain all subitems of group and moving to next page could reveal the otheres.
One exception to this is the use of DISTINCT (grouping but not including group items)
*/

/*
http://localhost:3001/agg/blogs?tags2.name={in}node1
http://localhost:3001/agg/item?campaigns={ne}null&lookup_match=branch:vendor:campaigns.vender:branches:location:{center}28.8640022277832,41.00006305078956,0.01
*/

//DISTINCT http://localhost:3001/agg/transaction?group_by=account&page=1&per_page=2
//FULL http://localhost:3001/agg/transaction?group_by=account,{project}total={sum}amount&select=_id,account,two,status,amount&sort_by=net&page=1&per_page=100&fields1=one={add}1:&fields2=two={add}1:$one

interface Lookup {
    from: string;
    foreignField: string;
    localField: string;
    as: string;
    unwind?: boolean;
}

export class QueryParser {
    private dateOperators = ["year", "month", "date", "hour", "minute", "second"];
    private dateMethods = [
        (d: Date) => d.getFullYear(),
        (d: Date) => d.getMonth(),
        (d: Date) => d.getDate(),
        (d: Date) => d.getHours(),
        (d: Date) => d.getMinutes(),
        (d: Date) => d.getSeconds(),
    ];
    private objectIdPattern = /^[0-9a-fA-F]{24}$/; // Regular expression for ObjectId

    _operator(s: string, key?: string, model?: Model<any>) {
        const operatorMatches = operatorPattern.exec(s);
        if (!operatorMatches) return null;
        const operator = operatorMatches[1];
        const val = operatorMatches[2];

        if (operator === "eq" || operator === "ne" || operator === "not") return { [key]: { ["$" + operator]: this.autoParseValue(val, key, model) } };
        else if (operator === "gt" || operator === "gte" || operator === "lt" || operator === "lte") return { [key]: { ["$" + operator]: this.autoParseValue(val, key, model) } };
        else if (operator === "btw") {
            const range = (val || "").split(",");
            const [min, max] = [this.autoParseValue(range[0], key, model), this.autoParseValue(range[1], key, model)];
            if ((min instanceof Date && max instanceof Date && min < max) || (!isNaN(min) && !isNaN(max) && min < max)) {
                return [{ [key]: { $gte: min } }, { [key]: { $lte: max } }];
            } else return;
        } else if (operator === "all" || operator === "in" || operator === "nin" || /in\d/.test(operator)) {
            const array = typeof val === "string" ? (val || "").split(",") : [val];
            if (/in\d/.test(operator)) {
                //nesting
                const [, nesting] = /in(\d)/.exec(operator) || [];
                let n = +nesting;
                if (n > 0) {
                    const elemMatch: any = {};
                    let pointer = elemMatch;

                    while (n > 0) {
                        --n;
                        pointer["$elemMatch"] = {};
                        pointer = pointer["$elemMatch"];
                    }
                    pointer["name"] = array[0];
                    return { [key]: elemMatch };
                }
            }
            return { [key]: { ["$" + operator]: array.map((val) => this.autoParseValue(val, key, model)) } };
        } else if (operator === "center") {
            const [long, lat, radius] = (val || "").split(",").map((p: string) => +p);
            const within: any = { $geoWithin: { $center: [[long, lat], radius] } };
            return { [key]: within };
        } else if (operator === "exists") return { [key]: { $exists: true } };
        else if (this.dateOperators.indexOf(operator) > -1) {
            const date = this.autoParseValue(val, key, model);
            if (!(date instanceof Date)) {
                logger.warn("DATE_EXPECTED", { key, val });
                return undefined;
            }

            const max: SpreadDate = [date.getFullYear(), 11, 31, 23, 59, 59, 999];
            const min: SpreadDate = [date.getFullYear(), 0, 1, 0, 0, 0, 0];

            const operatorOrder = this.dateOperators.indexOf(operator);
            for (let i = 1; i < operatorOrder; i++) {
                max[i] = min[i] = this.dateMethods[i](date);
            }
            return [{ [key]: { $gte: new Date(...min) } }, { [key]: { $lte: new Date(...max) } }];
        } else console.error("UNKNOWN OP", { key, operator });
    }

    private parseExpression(key: string, value: string, model?: Model<any>): any {
        //OR
        const subExpressions = value.split("|").filter((s) => s);
        if (subExpressions.length > 1) {
            const $or = subExpressions.map((sub) => {
                const s_exp = sub.split("=");
                if (s_exp.length === 1) return this.parseExpression(key, sub, model);
                else return this.parseExpression(s_exp[0], s_exp[1], model);
            });
            return { $or };
        }

        //OPERATOR
        const o = this._operator(value, key, model);
        if (o) {
            return o;
            // const { operator, val } = o;

            // if (operator === 'eq' || operator === 'ne' || operator === 'not') return { [key]: { ['$' + operator]: val } };
            // else if (operator === 'gt' || operator === 'gte' || operator === 'lt' || operator === 'lte') return { [key]: { ['$' + operator]: val } };
            // else if (operator === 'btw') {
            //     const range = (val || '').split(',');
            //     const [min, max] = [this.autoParseValue(range[0], key, model), this.autoParseValue(range[1], key, model)];
            //     if ((min instanceof Date && max instanceof Date && min < max) || (!isNaN(min) && !isNaN(max) && min < max)) {
            //         return [{ [key]: { $gte: min } }, { [key]: { $lte: max } }];
            //     } else return;
            // } else if (operator === 'all' || operator === 'in' || operator === 'nin' || /in\d/.test(operator)) {
            //     const array = typeof val === 'string' ? (val || '').split(',') : [val];
            //     if (/in\d/.test(operator)) {
            //         //nesting
            //         const [, nesting] = /in(\d)/.exec(operator) || [];
            //         let n = +nesting;
            //         if (n > 0) {
            //             const elemMatch: any = {};
            //             let pointer = elemMatch;

            //             while (n > 0) {
            //                 --n;
            //                 pointer['$elemMatch'] = {};
            //                 pointer = pointer['$elemMatch'];
            //             }
            //             pointer['name'] = array[0];
            //             return { [key]: elemMatch };
            //         }
            //     }
            //     return { [key]: { ['$' + operator]: array } };
            // } else if (operator === 'center') {
            //     const [long, lat, radius] = (val || '').split(',').map((p: string) => +p);
            //     const within: any = { $geoWithin: { $center: [[long, lat], radius] } };
            //     return { [key]: within };
            // } else if (operator === 'exists') return { [key]: { $exists: true } };
            // else if (val instanceof Date && this.dateOperators.indexOf(operator) > -1) {
            //     const max: SpreadDate = [val.getFullYear(), 11, 31, 23, 59, 59, 999];
            //     const min: SpreadDate = [val.getFullYear(), 0, 1, 0, 0, 0, 0];

            //     const operatorOrder = this.dateOperators.indexOf(operator);
            //     for (let i = 1; i < operatorOrder; i++) {
            //         max[i] = min[i] = this.dateMethods[i](val);
            //     }
            //     return [{ [key]: { $gte: new Date(...min) } }, { [key]: { $lte: new Date(...max) } }];
            // } else console.error('UNKNOWN OP', { key, operator });
        } else {
            //If not operator the default value conversion is string
            const val = this.autoParseValue(value, key, model);
            if (val === "") return;
            if (val === undefined) return { [key]: { $exists: false } };
            else if (typeof val === "string" && val.indexOf("*") > -1) {
                const purified = this.escapeRegex(value);
                return { [key]: new RegExp(purified, "gi") };
            } else return { [key]: val };
        }
    }

    private escapeRegex(value: string) {
        let purified = "";
        for (let i = 0; i < value.length; i++) {
            const char = value[i];
            const prevChar = i > 0 ? value[i - 1] : null;

            if (i === 0 && char != "*") purified = "^"; //strict check

            switch (char) {
                case "*":
                    if (prevChar === "*" || prevChar === null) break;
                    else purified += "*";
                    break;
                case "\\":
                    break; //bad char
                case ".":
                case "+":
                case "?":
                case "^":
                case "$":
                case "{":
                case "}":
                case "(":
                case ")":
                case "[":
                case "]":
                case "|":
                    purified += "\\" + char;
                    break; //escape regex char
                default:
                    purified += char;
                    break;
            }
        }
        purified = purified.endsWith("*") ? purified.substring(0, purified.length - 1) : purified;
        return purified;
    }

    private getPathType(path: string, model: Model<any>) {
        return model.schema.path(path)?.instance ?? "String";
    }

    autoParseValue(value: string, key: string, model?: Model<any>): any {
        if (value === "") return "";
        if (value === "null") return null;
        if (value === "undefined") return undefined;
        if (value === "true") return true;
        if (value === "false") return false;

        const keyType = key && model ? (this.getPathType(key, model) ?? "String") : "String";
        if (keyType === "String") return value;
        if (keyType === "Date") return new Date(value);
        if (keyType === "ObjectId") return ObjectId.isValid(value) ? new ObjectId(value) : value;
        if (keyType === "Number") return +value;
        if (keyType === "Array") {
            if (value.indexOf && value.indexOf(":") > -1)
                return value
                    .split(":")
                    .filter((x) => x)
                    .map((x) => this.autoParseValue(x, key, model));
            return value;
        } else return value;
    }

    private _select(s: string) {
        const select: { [field: string]: 1 | 0 } = {};
        const fields = s.split(",");
        for (const x of fields) {
            if (x.startsWith("!")) select[x.substring(1)] = 0;
            else select[x] = 1;
        }
        return select;
    }

    private _fields(s: string) {
        const g = s.split(",");
        let fields: { [field: string]: any } | undefined;

        for (let j = 0; j < g.length; j++) {
            const x = g[j];
            const segments = x.split("=");
            if (segments.length > 1) {
                fields = fields || {};
                const o = this._operator(segments[1]);
                if (o) {
                    const res = Object.entries(o).at(0) as [string, any];
                    fields[segments[0]] = { [res[0]]: res[1] || 1 };
                } else fields[segments[0]] = segments[1];
            }
        }
        return fields;
    }

    _autoLookups(model: Model<any>, from: string) {
        if (!model || !model.schema) return [];
        const schemaPaths = model.schema.paths;
        const lookups: Lookup[] = Object.keys(schemaPaths).map((key) => {
            const pathOptions = schemaPaths[key]?.options;

            if (from !== "auto" && from !== key) return;

            if (pathOptions?.autolookup && pathOptions?.ref) {
                return {
                    from: pathOptions.ref,
                    foreignField: pathOptions.foreignField ?? "_id",
                    localField: pathOptions.localField ?? key,
                    as: pathOptions.autolookup,
                    unwind: pathOptions.unwind ?? schemaPaths[key].instance !== "Array", // Unwind if the field is not an array
                };
            }
        });

        return lookups.filter((x) => x);
    }

    parse(query: { [key: string]: string }[], model?: Model<any>) {
        const queryArray = query.map((x) =>
            Object.keys(x).map((k) => {
                return { key: k, value: x[k] };
            }),
        );
        const q = queryArray.length ? queryArray.reduce((a, b) => a.concat(b)) : [];

        const filter: { $and?: any[] } = { $and: [] };
        let page = 1;
        let per_page = 100;
        let sort: { [field: string]: 1 | -1 } | undefined;
        let select: { [field: string]: 1 | 0 } | undefined;
        let fields1: { [field: string]: any } | undefined;
        let fields2: { [field: string]: any } | undefined;
        let fields3: { [field: string]: any } | undefined;
        let lookups: Lookup[] = [];
        let lookupsMatch: { from: string; foreignField: string; localField: string; match: any[]; as: string }[] | undefined;
        let group_fields: { [field: string]: any } | undefined;
        let group: any;

        for (let i = 0; i < q.length; ++i) {
            const x = q[i];
            if (x.key === "page" && !isNaN(+x.value)) page = +x.value;
            else if (x.key === "per_page" && !isNaN(+x.value)) 
            {
                per_page = Math.min(+x.value, 500);
            }
            else if (x.key === "group_by") {
                const g = x.value.split(",");
                const key = g.length > 1 ? g.shift() : x.value;
                group = { _id: "$" + key };

                if (g.length && g[0].startsWith("{project}")) {
                    group.items = { $push: "$$ROOT" };
                    g[0] = g[0].substring(9);
                    group_fields = this._fields(g.join(","));
                }
            } else if (x.key === "sort_by" && x.value) {
                const sort_by_array = x.value.split(",");
                const [field, direction] = sort_by_array;
                if (sort_by_array.length === 1 && field.startsWith("-")) sort = { [field.substring(1)]: -1 };
                else sort = { [field]: direction === "desc" ? -1 : 1 };
            } else if (x.key === "select" && x.value) select = this._select(x.value);
            else if (x.key === "fields1" && x.value) fields1 = this._fields(x.value);
            else if (x.key === "fields2" && x.value) fields2 = this._fields(x.value);
            else if (x.key === "fields3" && x.value) fields3 = this._fields(x.value);
            else if (x.key === "lookup" && x.value) {
                //lookup=lookup_1;lookup_2
                const _lookups: Lookup[][] = x.value.split(";").map((l) => {
                    //lookup=collection:foreign:local:as
                    const p = l.split(":");
                    if (p.length === 4 || p.length === 5) {
                        const [from, foreignField, localField, as] = p;
                        let unwind = false;
                        if (p.length === 5 && p[4] === "unwind") unwind = true;
                        return [{ from, foreignField, localField, as, unwind }];
                    } else if (p.length === 1) {
                        const [from] = p;
                        return this._autoLookups(model, from);
                    }

                    throw "INVALID_LOOKUP_PARAMS";
                });
                lookups = _lookups.reduce((a, b) => a.concat(b));
            } else if (x.key === "lookup_match") {
                //lookup_match=lookup_1;lookup_2
                lookupsMatch = x.value.split(";").map((l) => {
                    //lookup=collection:foriegn:local:as:f1:v1
                    let p = l.split(":");

                    const [from, foreignField, localField, as] = p;
                    const match = [];
                    p = p.slice(4);
                    for (let i = 0; i < p.length; i += 2) {
                        const exp = this.parseExpression(p[i], p[i + 1], model);
                        logger.info(exp);

                        match.push(exp);
                    }
                    return { from, foreignField, localField, as, match };
                });
            } else if (x.value) {
                const exp = this.parseExpression(x.key, x.value, model);
                if (exp) {
                    if (Array.isArray(exp)) filter.$and = filter.$and?.concat(exp);
                    else filter.$and?.push(exp);
                }
            }
        }

        if (filter.$and?.length === 0) delete filter.$and; //and won't accept zero expressions

        if (group && group_fields) {
            Object.keys(group_fields).forEach((k) => {
                group[k] = (<any>group_fields)[k];
            }); // { exta_field : {$operator:value} }
            if (group.items) {
                //move items to last entry
                const items = group.items;
                delete group.items;
                group.items = items;
            }
        }

        return { page, per_page, filter, select, sort, fields1, fields2, fields3, group, lookups, lookupsMatch };
    }
}

//todo test lookup_mach for non array join
