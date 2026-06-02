// ================================================================
//  SimpleUAE — PostgreSQL Migration  (run once: npm run migrate)
// ================================================================
const { query } = require('./db');
const { v4: uuidv4 } = require('uuid');

// Load .env.local manually without dotenv
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && !key.startsWith('#') && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

async function migrate() {
  console.log('🔧 Running SimpleUAE PostgreSQL migration...\n');

  await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  await query(`CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL, code TEXT NOT NULL, emirate TEXT NOT NULL,
    location TEXT, price_from NUMERIC(10,2), rating NUMERIC(3,1),
    reviews TEXT, tags TEXT[] DEFAULT '{}', color TEXT,
    status TEXT DEFAULT 'live', featured BOOLEAN DEFAULT false,
    website TEXT, phone TEXT, email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  console.log('✅ Table: schools');

  await query(`CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    full_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
    license_type TEXT, home_country_license TEXT, prior_experience TEXT,
    emirates TEXT[] DEFAULT '{}', additional_info TEXT,
    consent BOOLEAN DEFAULT false, status TEXT DEFAULT 'new',
    ip_address TEXT, user_agent TEXT, referrer TEXT, source TEXT DEFAULT 'comparison-form',
    notes TEXT, assigned_school TEXT,
    ai_score NUMERIC, ai_label TEXT, ai_reason TEXT,
    engine_size TEXT, bike_purpose TEXT, bus_use TEXT, bus_op TEXT,
    truck_cargo TEXT, hgv_type TEXT, hgv_purpose TEXT,
    forklift_type TEXT, forklift_industry TEXT, equip_type TEXT, equip_project TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await query(`CREATE INDEX IF NOT EXISTS leads_status_idx  ON leads(status)`);
  await query(`CREATE INDEX IF NOT EXISTS leads_license_idx ON leads(license_type)`);
  await query(`CREATE INDEX IF NOT EXISTS leads_created_idx ON leads(created_at DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS leads_email_idx   ON leads(email)`);
  console.log('✅ Table: leads');

  await query(`CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT, action TEXT, message TEXT, meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await query(`CREATE INDEX IF NOT EXISTS logs_created_idx ON logs(created_at DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS logs_type_idx    ON logs(type)`);
  console.log('✅ Table: logs');

  await query(`CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    date DATE UNIQUE NOT NULL,
    page_views INTEGER DEFAULT 0, comparisons INTEGER DEFAULT 0, leads INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await query(`CREATE INDEX IF NOT EXISTS analytics_date_idx ON analytics(date)`);
  console.log('✅ Table: analytics');

  await query(`CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key TEXT UNIQUE NOT NULL, value TEXT, sensitive BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  console.log('✅ Table: settings');

  await query(`CREATE TABLE IF NOT EXISTS content (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key TEXT UNIQUE NOT NULL, value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  console.log('✅ Table: content');

  await query(`CREATE TABLE IF NOT EXISTS emaillog (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    to_addr TEXT, subject TEXT, type TEXT, status TEXT, error TEXT, lead_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await query(`CREATE INDEX IF NOT EXISTS emaillog_created_idx ON emaillog(created_at DESC)`);
  console.log('✅ Table: emaillog');

  await query(`CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql`);
  for (const tbl of ['schools','leads','logs','analytics','settings','content']) {
    await query(`DROP TRIGGER IF EXISTS trg_${tbl}_upd ON ${tbl};
      CREATE TRIGGER trg_${tbl}_upd BEFORE UPDATE ON ${tbl}
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()`);
  }
  console.log('✅ Auto updated_at triggers set');

  const existing = await query('SELECT COUNT(*) FROM schools');
  if (parseInt(existing[0].count) === 0) {
    console.log('\n🌱 Seeding UAE driving schools...');
    await seedSchools();
    console.log('✅ Schools seeded');
  } else {
    console.log(`ℹ️  Schools already exist (${existing[0].count} rows), skipping seed`);
  }

  console.log('\n🎉 Migration complete! Your PostgreSQL database is ready.\n');
  process.exit(0);
}

async function seedSchools() {
  const schools = [
    { name:'Emirates Driving Institute',   code:'E',  emirate:'Dubai',          location:'Dubai - Al Quoz, Al Qusais, Jumeirah (53 branches)',       price_from:3765, rating:4.7, reviews:'2,400+', tags:['Car','Motorcycle','Bus','Truck'],   color:'#B8844A', status:'live', featured:true,  website:'https://edi-uae.com',               phone:'+971 4 263 1100', email:'info@edi-uae.com' },
    { name:'Galadari Motor Driving Centre', code:'G',  emirate:'Dubai',          location:'Dubai - Al Qusais, Al Quoz, Dubai Mall (60+ branches)',     price_from:3880, rating:4.4, reviews:'1,800+', tags:['Car','Truck','Forklift'],          color:'#C4673A', status:'live', featured:false, website:'https://www.gmdc.ae',               phone:'+971 4 267 6166', email:'info@gmdc.ae' },
    { name:'Belhasa Driving Center',        code:'B',  emirate:'Dubai',          location:'Dubai - Al Wasl, Al Quoz, Jebel Ali, Marina (15+ branches)',price_from:3675, rating:4.6, reviews:'3,100+', tags:['Car','Motorcycle','VIP','Heavy'], color:'#4A3728', status:'live', featured:true,  website:'https://www.bdc.ae',                phone:'+971 4 509 1200', email:'info@bdc.ae' },
    { name:'Dubai Driving Center',          code:'D',  emirate:'Dubai',          location:'Dubai - Jumeirah, Al Khail Gate, DIP (21 branches)',         price_from:3660, rating:4.3, reviews:'950+',   tags:['Car','Motorcycle','Bus'],           color:'#7A5230', status:'live', featured:false, website:'https://www.dubaidrivingcenter.net', phone:'+971 4 345 5855', email:null },
    { name:'Excellence Driving School',     code:'Ex', emirate:'Dubai',          location:'Dubai - Al Qusais, Al Barsha (22 branches)',                 price_from:3077, rating:4.5, reviews:'1,200+', tags:['Car'],                            color:'#9B6E38', status:'live', featured:false, website:'https://excellenceds.ae',           phone:'+971 600 515 154', email:null },
    { name:'Al Ahli Driving Center',        code:'AA', emirate:'Dubai',          location:'Dubai - Al Quoz, Al Nahda (10+ branches)',                   price_from:3100, rating:4.4, reviews:'1,400+', tags:['Car','Motorcycle','Bus'],           color:'#5A4020', status:'live', featured:false, website:null, phone:null, email:null },
    { name:'Abu Dhabi Driving Center',      code:'A',  emirate:'Abu Dhabi',      location:'Abu Dhabi - Main branch & 5 centres',                        price_from:4000, rating:4.4, reviews:'1,200+', tags:['Car','Heavy Truck','Bus'],          color:'#5A4020', status:'live', featured:true,  website:'https://www.addc.ae', phone:null, email:null },
    { name:'Emirates Driving Company',      code:'ED', emirate:'Abu Dhabi',      location:'Abu Dhabi - Musaffah & Khalifa City',                         price_from:3800, rating:4.3, reviews:'800+',   tags:['Car','Motorcycle'],                color:'#7A5230', status:'live', featured:false, website:null, phone:null, email:null },
    { name:'Sharjah Driving Institute',     code:'SD', emirate:'Sharjah',        location:'Sharjah - Main campus',                                      price_from:3500, rating:4.2, reviews:'600+',   tags:['Car','Motorcycle','Truck'],         color:'#9B6E38', status:'live', featured:false, website:null, phone:null, email:null },
    { name:'Ajman Driving Center',          code:'AJ', emirate:'Ajman',          location:'Ajman - Central',                                            price_from:3200, rating:4.1, reviews:'400+',   tags:['Car','Motorcycle'],                color:'#B8844A', status:'live', featured:false, website:null, phone:null, email:null },
    { name:'RAK Driving School',            code:'RK', emirate:'Ras Al Khaimah', location:'Ras Al Khaimah - City centre',                               price_from:3000, rating:4.0, reviews:'300+',   tags:['Car'],                             color:'#C4673A', status:'live', featured:false, website:null, phone:null, email:null },
    { name:'Fujairah Driving School',       code:'FJ', emirate:'Fujairah',       location:'Fujairah - Corniche',                                        price_from:2900, rating:4.0, reviews:'250+',   tags:['Car','Motorcycle'],                color:'#4A3728', status:'live', featured:false, website:null, phone:null, email:null },
  ];
  for (const s of schools) {
    await query(
      `INSERT INTO schools (id,name,code,emirate,location,price_from,rating,reviews,tags,color,status,featured,website,phone,email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [uuidv4(),s.name,s.code,s.emirate,s.location,s.price_from,s.rating,s.reviews,s.tags,s.color,s.status,s.featured,s.website,s.phone,s.email]
    );
  }
}

migrate().catch(err => { console.error('❌ Migration failed:', err.message); process.exit(1); });
