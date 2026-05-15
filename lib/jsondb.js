// ================================================================
//  SimpleUAE — JSON File Database Engine
//  Replaces MongoDB/Mongoose with flat JSON files.
//  Each "collection" is a single JSON file in /data/
// ================================================================

const fs   = require('fs');
const path = require('path');


const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readAll(name) {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return [];
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return [];
  }
}

function writeAll(name, data) {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf8');
}

function matchesFilter(doc, filter) {
  for (const [key, val] of Object.entries(filter)) {
    if (key === '$or') {
      if (!val.some(sub => matchesFilter(doc, sub))) return false;
      continue;
    }
    if (key === '$and') {
      if (!val.every(sub => matchesFilter(doc, sub))) return false;
      continue;
    }
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      if ('$in' in val) {
        const docVal = doc[key];
        const arr = val.$in;
        if (Array.isArray(docVal)) {
          if (!docVal.some(v => arr.includes(v))) return false;
        } else {
          if (!arr.includes(docVal)) return false;
        }
        continue;
      }
      if ('$gte' in val && doc[key] < val.$gte) return false;
      if ('$lte' in val && doc[key] > val.$lte) return false;
      if ('$gt'  in val && doc[key] <= val.$gt) return false;
      if ('$lt'  in val && doc[key] >= val.$lt) return false;
      if ('$ne'  in val && doc[key] === val.$ne) return false;
      if ('$regex' in val) {
        const flags = val.$options || '';
        if (!new RegExp(val.$regex, flags).test(doc[key] || '')) return false;
      }
      if ('$exists' in val) {
        const has = key in doc;
        if (val.$exists && !has) return false;
        if (!val.$exists && has) return false;
      }
      continue;
    }
    if (Array.isArray(doc[key])) {
      if (!doc[key].includes(val)) return false;
    } else if (doc[key] !== val) {
      return false;
    }
  }
  return true;
}

function applyUpdate(doc, update) {
  if ('$inc' in update) {
    for (const [k, v] of Object.entries(update.$inc)) {
      doc[k] = (doc[k] || 0) + v;
    }
  }
  if ('$set' in update) {
    Object.assign(doc, update.$set);
  }
  if ('$push' in update) {
    for (const [k, v] of Object.entries(update.$push)) {
      if (!Array.isArray(doc[k])) doc[k] = [];
      doc[k].push(v);
    }
  }
  const hasOperator = ['$inc','$set','$push','$unset','$addToSet'].some(op => op in update);
  if (!hasOperator) {
    Object.assign(doc, update);
  }
  doc.updatedAt = new Date().toISOString();
  return doc;
}

function sortDocs(docs, sortObj) {
  if (!sortObj || Object.keys(sortObj).length === 0) return docs;
  const [[key, dir]] = Object.entries(sortObj);
  return [...docs].sort((a, b) => {
    const av = a[key], bv = b[key];
    if (av == null) return 1;
    if (bv == null) return -1;
    return dir === 1 || dir === 'asc'
      ? av > bv ? 1 : av < bv ? -1 : 0
      : av < bv ? 1 : av > bv ? -1 : 0;
  });
}

class Collection {
  constructor(name) {
    this.name = name;
  }

  find(filter = {}) {
    let docs = readAll(this.name).filter(d => matchesFilter(d, filter));
    return this._chain(docs);
  }

  _chain(docs) {
    return {
      sort:  (s) => this._chain(sortDocs(docs, s)),
      skip:  (n) => this._chain(docs.slice(n)),
      limit: (n) => this._chain(docs.slice(0, n)),
      lean:  ()  => Promise.resolve(docs),
      populate: () => ({ lean: () => Promise.resolve(docs), then: (fn) => Promise.resolve(docs).then(fn) }),
      then: (fn) => Promise.resolve(docs).then(fn),
    };
  }

  async findOne(filter = {}) {
    const docs = readAll(this.name);
    return docs.find(d => matchesFilter(d, filter)) || null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async countDocuments(filter = {}) {
    const docs = readAll(this.name);
    if (!filter || Object.keys(filter).length === 0) return docs.length;
    return docs.filter(d => matchesFilter(d, filter)).length;
  }

  async create(data) {
    const docs = readAll(this.name);
    const now  = new Date().toISOString();
    const doc  = { _id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
    docs.push(doc);
    writeAll(this.name, docs);
    return doc;
  }

  async insertMany(items) {
    const docs = readAll(this.name);
    const now  = new Date().toISOString();
    const newDocs = items.map(item => ({ _id: crypto.randomUUID(), ...item, createdAt: now, updatedAt: now }));
    writeAll(this.name, [...docs, ...newDocs]);
    return newDocs;
  }

  async findOneAndUpdate(filter, update, opts = {}) {
    const docs = readAll(this.name);
    let idx = docs.findIndex(d => matchesFilter(d, filter));
    let doc;
    if (idx === -1) {
      if (opts.upsert) {
        const now = new Date().toISOString();
        const filterFlat = {};
        for (const [k, v] of Object.entries(filter)) {
          if (typeof v !== 'object') filterFlat[k] = v;
        }
        doc = { _id: crypto.randomUUID(), ...filterFlat, createdAt: now };
        applyUpdate(doc, update);
        docs.push(doc);
      } else {
        return null;
      }
    } else {
      doc = { ...docs[idx] };
      applyUpdate(doc, update);
      docs[idx] = doc;
    }
    writeAll(this.name, docs);
    return opts.new !== false ? doc : docs[idx];
  }

  async findByIdAndUpdate(id, update, opts = {}) {
    return this.findOneAndUpdate({ _id: id }, update, opts);
  }

  async findByIdAndDelete(id) {
    const docs = readAll(this.name);
    const idx  = docs.findIndex(d => d._id === id);
    if (idx === -1) return null;
    const [removed] = docs.splice(idx, 1);
    writeAll(this.name, docs);
    return removed;
  }

  async deleteMany(filter = {}) {
    const docs = readAll(this.name);
    const remaining = Object.keys(filter).length === 0
      ? []
      : docs.filter(d => !matchesFilter(d, filter));
    const count = docs.length - remaining.length;
    writeAll(this.name, remaining);
    return { deletedCount: count };
  }

  async aggregate(pipeline) {
    let docs = readAll(this.name);
    for (const stage of pipeline) {
      if ('$match' in stage) {
        docs = docs.filter(d => matchesFilter(d, stage.$match));
      } else if ('$unwind' in stage) {
        const field = stage.$unwind.replace('$', '');
        const expanded = [];
        docs.forEach(d => {
          const arr = d[field];
          if (Array.isArray(arr)) {
            arr.forEach(v => expanded.push({ ...d, [field]: v }));
          } else {
            expanded.push(d);
          }
        });
        docs = expanded;
      } else if ('$group' in stage) {
        const { _id: idExpr, ...accumulators } = stage.$group;
        const groups = {};
        docs.forEach(d => {
          const key = idExpr ? (idExpr.startsWith('$') ? d[idExpr.slice(1)] : idExpr) : null;
          const gkey = String(key);
          if (!groups[gkey]) groups[gkey] = { _id: key };
          for (const [outField, acc] of Object.entries(accumulators)) {
            if ('$sum' in acc) {
              const val = acc.$sum === 1 ? 1 : (typeof acc.$sum === 'string' ? d[acc.$sum.slice(1)] : acc.$sum);
              groups[gkey][outField] = (groups[gkey][outField] || 0) + (val || 0);
            }
          }
        });
        docs = Object.values(groups);
      } else if ('$sort' in stage) {
        docs = sortDocs(docs, stage.$sort);
      } else if ('$limit' in stage) {
        docs = docs.slice(0, stage.$limit);
      }
    }
    return docs;
  }
}

const registry = {};
function model(name) {
  if (!registry[name]) registry[name] = new Collection(name.toLowerCase() + 's');
  return registry[name];
}

module.exports = { model, Collection, readAll, writeAll };
