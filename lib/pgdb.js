// ================================================================
//  SimpleUAE — PostgreSQL Database Engine
//  Drop-in replacement for lib/jsondb.js — same model() API
// ================================================================
const { query } = require('./db');
const { v4: uuidv4 } = require('uuid');

const TABLE_MAP = {
  leads: {
    table: 'leads',
    cols: {
      _id:'id', fullName:'full_name', email:'email', phone:'phone',
      licenseType:'license_type', homeCountryLicense:'home_country_license',
      priorExperience:'prior_experience', emirates:'emirates',
      additionalInfo:'additional_info', consent:'consent', status:'status',
      ipAddress:'ip_address', userAgent:'user_agent', referrer:'referrer',
      source:'source', notes:'notes', assignedSchool:'assigned_school',
      aiScore:'ai_score', aiLabel:'ai_label', aiReason:'ai_reason',
      engineSize:'engine_size', bikePurpose:'bike_purpose',
      busUse:'bus_use', busOp:'bus_op', truckCargo:'truck_cargo',
      hgvType:'hgv_type', hgvPurpose:'hgv_purpose',
      forkliftType:'forklift_type', forkliftIndustry:'forklift_industry',
      equipType:'equip_type', equipProject:'equip_project',
      createdAt:'created_at', updatedAt:'updated_at',
    },
    fromRow: (row) => row ? {
      _id:row.id, fullName:row.full_name, email:row.email, phone:row.phone,
      licenseType:row.license_type, homeCountryLicense:row.home_country_license,
      priorExperience:row.prior_experience, emirates:row.emirates||[],
      additionalInfo:row.additional_info, consent:row.consent, status:row.status,
      ipAddress:row.ip_address, userAgent:row.user_agent, referrer:row.referrer,
      source:row.source, notes:row.notes, assignedSchool:row.assigned_school,
      aiScore:row.ai_score, aiLabel:row.ai_label, aiReason:row.ai_reason,
      vehicleDetails:{
        engineSize:row.engine_size, bikePurpose:row.bike_purpose,
        busUse:row.bus_use, busOp:row.bus_op, truckCargo:row.truck_cargo,
        hgvType:row.hgv_type, hgvPurpose:row.hgv_purpose,
        forkliftType:row.forklift_type, forkliftIndustry:row.forklift_industry,
        equipType:row.equip_type, equipProject:row.equip_project,
      },
      createdAt:row.created_at, updatedAt:row.updated_at,
    } : null,
  },
  schools: {
    table: 'schools',
    cols: {
      _id:'id', name:'name', code:'code', emirate:'emirate',
      location:'location', priceFrom:'price_from', rating:'rating',
      reviews:'reviews', tags:'tags', color:'color', status:'status',
      featured:'featured', website:'website', phone:'phone', email:'email',
      createdAt:'created_at', updatedAt:'updated_at',
    },
    fromRow: (row) => row ? {
      _id:row.id, name:row.name, code:row.code, emirate:row.emirate,
      location:row.location, priceFrom:parseFloat(row.price_from),
      rating:parseFloat(row.rating), reviews:row.reviews,
      tags:row.tags||[], color:row.color, status:row.status,
      featured:row.featured, website:row.website, phone:row.phone, email:row.email,
      createdAt:row.created_at, updatedAt:row.updated_at,
    } : null,
  },
  logs: {
    table: 'logs',
    cols: { _id:'id', type:'type', action:'action', message:'message', meta:'meta', createdAt:'created_at', updatedAt:'updated_at' },
    fromRow: (row) => row ? { _id:row.id, type:row.type, action:row.action, message:row.message, meta:row.meta||{}, createdAt:row.created_at, updatedAt:row.updated_at } : null,
  },
  analytics: {
    table: 'analytics',
    cols: { _id:'id', date:'date', pageViews:'page_views', comparisons:'comparisons', leads:'leads', createdAt:'created_at', updatedAt:'updated_at' },
    fromRow: (row) => row ? {
      _id:row.id,
      date: row.date instanceof Date ? row.date.toISOString().slice(0,10) : String(row.date).slice(0,10),
      pageViews:parseInt(row.page_views)||0, comparisons:parseInt(row.comparisons)||0, leads:parseInt(row.leads)||0,
      createdAt:row.created_at, updatedAt:row.updated_at,
    } : null,
  },
  settings: {
    table: 'settings',
    cols: { _id:'id', key:'key', value:'value', sensitive:'sensitive', createdAt:'created_at', updatedAt:'updated_at' },
    fromRow: (row) => row ? { _id:row.id, key:row.key, value:row.value, sensitive:row.sensitive, createdAt:row.created_at, updatedAt:row.updated_at } : null,
  },
  content: {
    table: 'content',
    cols: { _id:'id', key:'key', value:'value', createdAt:'created_at', updatedAt:'updated_at' },
    fromRow: (row) => row ? { _id:row.id, key:row.key, value:row.value, createdAt:row.created_at, updatedAt:row.updated_at } : null,
  },
  emaillog: {
    table: 'emaillog',
    cols: { _id:'id', to:'to_addr', subject:'subject', type:'type', status:'status', error:'error', leadId:'lead_id', createdAt:'created_at' },
    fromRow: (row) => row ? { _id:row.id, to:row.to_addr, subject:row.subject, type:row.type, status:row.status, error:row.error, leadId:row.lead_id, createdAt:row.created_at } : null,
  },
};

function buildWhere(cfg, filter, startIdx=1) {
  if (!filter || Object.keys(filter).length===0) return { sql:'', params:[], nextIdx:startIdx };
  const parts=[], params=[];
  let idx=startIdx;
  function colName(k) { return cfg.cols[k]||k; }
  function process(f) {
    for (const [key,val] of Object.entries(f)) {
      if (key==='$or') {
        const orParts=val.map(sub=>{ const r=buildWhere(cfg,sub,idx); idx=r.nextIdx; params.push(...r.params); return r.sql?`(${r.sql})`:'TRUE'; });
        parts.push(`(${orParts.join(' OR ')})`); continue;
      }
      if (key==='$and') {
        const andParts=val.map(sub=>{ const r=buildWhere(cfg,sub,idx); idx=r.nextIdx; params.push(...r.params); return r.sql?`(${r.sql})`:'TRUE'; });
        parts.push(`(${andParts.join(' AND ')})`); continue;
      }
      const col=colName(key);
      if (typeof val==='object'&&val!==null&&!Array.isArray(val)) {
        if ('$in' in val) {
          const isArr=['tags','emirates'].includes(col);
          params.push(val.$in);
          parts.push(isArr?`${col} && $${idx++}`:`${col} = ANY($${idx++})`); continue;
        }
        if ('$gte' in val){params.push(val.$gte);parts.push(`${col} >= $${idx++}`);}
        if ('$lte' in val){params.push(val.$lte);parts.push(`${col} <= $${idx++}`);}
        if ('$gt'  in val){params.push(val.$gt); parts.push(`${col} > $${idx++}`);}
        if ('$lt'  in val){params.push(val.$lt); parts.push(`${col} < $${idx++}`);}
        if ('$ne'  in val){params.push(val.$ne); parts.push(`${col} != $${idx++}`);}
        if ('$regex' in val){
          const flags=val.$options||'';
          const op=flags.includes('i')?'ILIKE':'LIKE';
          const pattern=`%${val.$regex.replace(/^\^/,'').replace(/\$$/,'')}%`;
          params.push(pattern); parts.push(`${col} ${op} $${idx++}`);
        }
        if ('$exists' in val) parts.push(val.$exists?`${col} IS NOT NULL`:`${col} IS NULL`);
        if ('$lt' in val){params.push(val.$lt);parts.push(`${col} < $${idx++}`);}
        continue;
      }
      if (val===null) parts.push(`${col} IS NULL`);
      else { params.push(val); parts.push(`${col} = $${idx++}`); }
    }
  }
  process(filter);
  return { sql:parts.length?parts.join(' AND '):'', params, nextIdx:idx };
}

function buildOrderBy(cfg, sortObj) {
  if (!sortObj||Object.keys(sortObj).length===0) return '';
  const parts=Object.entries(sortObj).map(([key,dir])=>{
    const col=cfg.cols[key]||key;
    const d=(dir===1||dir==='asc')?'ASC':'DESC';
    return `${col} ${d}`;
  });
  return `ORDER BY ${parts.join(', ')}`;
}

function applyUpdate(doc, update) {
  if ('$inc' in update) for(const[k,v]of Object.entries(update.$inc)) doc[k]=(doc[k]||0)+v;
  if ('$set' in update) Object.assign(doc, update.$set);
  if ('$push' in update) for(const[k,v]of Object.entries(update.$push)){if(!Array.isArray(doc[k]))doc[k]=[];doc[k].push(v);}
  const hasOp=['$inc','$set','$push','$unset','$addToSet'].some(op=>op in update);
  if (!hasOp) Object.assign(doc, update);
}

class Collection {
  constructor(name) {
    this.cfg = TABLE_MAP[name];
    if (!this.cfg) throw new Error(`No table config for: "${name}"`);
    this.name = name;
  }

  find(filter={}) {
    const cfg=this.cfg; let _filter=filter,_sort=null,_skip=0,_limit=null;
    const chain = {
      sort:(s)=>{_sort=s;return chain;},
      skip:(n)=>{_skip=n;return chain;},
      limit:(n)=>{_limit=n;return chain;},
      lean:()=>exec(),
      populate:()=>({lean:()=>exec(),then:(fn)=>exec().then(fn)}),
      then:(fn)=>exec().then(fn),
    };
    async function exec(){
      const {sql:where,params}=buildWhere(cfg,_filter);
      const order=buildOrderBy(cfg,_sort);
      let q=`SELECT * FROM ${cfg.table}`;
      if(where) q+=` WHERE ${where}`;
      if(order) q+=` ${order}`;
      if(_limit!==null) q+=` LIMIT ${_limit}`;
      if(_skip>0) q+=` OFFSET ${_skip}`;
      const rows=await query(q,params);
      return rows.map(cfg.fromRow);
    }
    return chain;
  }

  async findOne(filter={}) {
    const {sql:where,params}=buildWhere(this.cfg,filter);
    let q=`SELECT * FROM ${this.cfg.table}`;
    if(where) q+=` WHERE ${where}`;
    q+=' LIMIT 1';
    const rows=await query(q,params);
    return rows.length?this.cfg.fromRow(rows[0]):null;
  }

  async findById(id){ return this.findOne({_id:id}); }

  async countDocuments(filter={}) {
    const {sql:where,params}=buildWhere(this.cfg,filter);
    let q=`SELECT COUNT(*) FROM ${this.cfg.table}`;
    if(where) q+=` WHERE ${where}`;
    const rows=await query(q,params);
    return parseInt(rows[0].count);
  }

  async create(data) {
    const cfg=this.cfg, id=uuidv4();
    const flat={...data};
    if(flat.vehicleDetails&&typeof flat.vehicleDetails==='object'){Object.assign(flat,flat.vehicleDetails);delete flat.vehicleDetails;}
    const colNames=[],colValues=[],colParams=[];
    let idx=1;
    for(const[jsKey,val]of Object.entries(flat)){
      if(['_id','createdAt','updatedAt'].includes(jsKey)) continue;
      const col=cfg.cols[jsKey];
      if(!col||['id','created_at','updated_at'].includes(col)) continue;
      colNames.push(col); colValues.push(val); colParams.push(`$${idx++}`);
    }
    const sql=`INSERT INTO ${cfg.table} (id,${colNames.join(',')},created_at,updated_at) VALUES ($${idx},${colParams.join(',')},NOW(),NOW()) RETURNING *`;
    const rows=await query(sql,[...colValues,id]);
    return cfg.fromRow(rows[0]);
  }

  async insertMany(items){ const results=[]; for(const item of items) results.push(await this.create(item)); return results; }

  async findOneAndUpdate(filter,update,opts={}) {
    const existing=await this.findOne(filter);
    if(!existing){
      if(!opts.upsert) return null;
      const filterFlat={};
      for(const[k,v]of Object.entries(filter)) if(typeof v!=='object') filterFlat[k]=v;
      const newData={...filterFlat};
      applyUpdate(newData,update);
      return this.create(newData);
    }
    const updated={...existing};
    applyUpdate(updated,update);
    return this._updateById(existing._id,updated);
  }

  async findByIdAndUpdate(id,update,opts={}) {
    const existing=await this.findById(id);
    if(!existing) return null;
    const updated={...existing};
    applyUpdate(updated,update);
    return this._updateById(id,updated);
  }

  async _updateById(id,data) {
    const cfg=this.cfg;
    const flat={...data};
    if(flat.vehicleDetails&&typeof flat.vehicleDetails==='object'){Object.assign(flat,flat.vehicleDetails);delete flat.vehicleDetails;}
    const setParts=[],setValues=[];
    let idx=1;
    for(const[jsKey,val]of Object.entries(flat)){
      if(['_id','createdAt','updatedAt'].includes(jsKey)) continue;
      const col=cfg.cols[jsKey];
      if(!col||['id','created_at','updated_at'].includes(col)) continue;
      setParts.push(`${col}=$${idx++}`); setValues.push(val);
    }
    if(setParts.length===0) return data;
    const sql=`UPDATE ${cfg.table} SET ${setParts.join(',')},updated_at=NOW() WHERE id=$${idx} RETURNING *`;
    const rows=await query(sql,[...setValues,id]);
    return rows.length?cfg.fromRow(rows[0]):null;
  }

  async findByIdAndDelete(id) {
    const doc=await this.findById(id);
    if(!doc) return null;
    await query(`DELETE FROM ${this.cfg.table} WHERE id=$1`,[id]);
    return doc;
  }

  async deleteMany(filter={}) {
    const {sql:where,params}=buildWhere(this.cfg,filter);
    let q=`DELETE FROM ${this.cfg.table}`;
    if(where) q+=` WHERE ${where}`;
    const result=await query(q+' RETURNING id',params);
    return {deletedCount:result.length};
  }

  async aggregate(pipeline) {
    let docs=await this.find({}).lean();
    for(const stage of pipeline){
      if('$match' in stage) docs=await this.find(stage.$match).lean();
      else if('$group' in stage){
        const{_id:idExpr,...accs}=stage.$group;
        const groups={};
        docs.forEach(d=>{
          const key=idExpr?(typeof idExpr==='string'&&idExpr.startsWith('$')?d[idExpr.slice(1)]:idExpr):null;
          const gk=String(key);
          if(!groups[gk]) groups[gk]={_id:key};
          for(const[f,acc]of Object.entries(accs)){
            if('$sum' in acc){
              const val=acc.$sum===1?1:(typeof acc.$sum==='string'?d[acc.$sum.slice(1)]:acc.$sum);
              groups[gk][f]=(groups[gk][f]||0)+(val||0);
            }
          }
        });
        docs=Object.values(groups);
      } else if('$sort' in stage){
        const[[key,dir]]=Object.entries(stage.$sort);
        docs=[...docs].sort((a,b)=>{const av=a[key],bv=b[key];if(av==null)return 1;if(bv==null)return -1;return(dir===1||dir==='asc')?(av>bv?1:-1):(av<bv?1:-1);});
      } else if('$limit' in stage) docs=docs.slice(0,stage.$limit);
    }
    return docs;
  }
}

// readAll/writeAll stubs — not used in PG mode
function readAll(){ throw new Error('readAll() not available in PostgreSQL mode'); }
function writeAll(){ throw new Error('writeAll() not available in PostgreSQL mode'); }

const registry={};
function model(name){
  // normalize: 'Lead'→'leads', 'Analytics'→'analytics', 'Emaillog'→'emaillog'
  const key=name.toLowerCase()+'s';
  const directKey=name.toLowerCase();
  const resolved=TABLE_MAP[directKey]?directKey:(TABLE_MAP[key]?key:directKey);
  if(!registry[resolved]) registry[resolved]=new Collection(resolved);
  return registry[resolved];
}

module.exports = { model, Collection, readAll, writeAll };
