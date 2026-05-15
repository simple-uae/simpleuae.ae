const { model } = require('./jsondb');
const School = model('School');

exports.seedSchools = async () => {
  const schools = [
    // ── DUBAI ─────────────────────────────────────────────────────
    { name:'Emirates Driving Institute', code:'E', emirate:'Dubai', location:'Dubai — Al Quoz, Al Qusais, Jumeirah (53 branches)', priceFrom:3765, rating:4.7, reviews:'2,400+', tags:['Car','Motorcycle','Bus','Truck'], color:'#B8844A', status:'live', featured:true, website:'https://edi-uae.com', phone:'+971 4 263 1100', email:'info@edi-uae.com' },
    { name:'Galadari Motor Driving Centre', code:'G', emirate:'Dubai', location:'Dubai — Al Qusais, Al Quoz, Dubai Mall (60+ branches)', priceFrom:3880, rating:4.4, reviews:'1,800+', tags:['Car','Truck','Forklift'], color:'#C4673A', status:'live', website:'https://www.gmdc.ae', phone:'+971 4 267 6166', email:'info@gmdc.ae' },
    { name:'Belhasa Driving Center', code:'B', emirate:'Dubai', location:'Dubai — Al Wasl, Al Quoz, Jebel Ali, Marina (15+ branches)', priceFrom:3675, rating:4.6, reviews:'3,100+', tags:['Car','Motorcycle','VIP','Heavy'], color:'#4A3728', status:'live', featured:true, website:'https://www.bdc.ae', phone:'+971 4 509 1200', email:'info@bdc.ae' },
    { name:'Dubai Driving Center', code:'D', emirate:'Dubai', location:'Dubai — Jumeirah, Al Khail Gate, DIP (21 branches)', priceFrom:3660, rating:4.3, reviews:'950+', tags:['Car','Motorcycle','Bus'], color:'#7A5230', status:'live', website:'https://www.dubaidrivingcenter.net', phone:'+971 4 345 5855' },
    { name:'Excellence Driving School', code:'Ex', emirate:'Dubai', location:'Dubai — Al Qusais, Al Barsha (22 branches)', priceFrom:3077, rating:4.5, reviews:'1,200+', tags:['Car'], color:'#9B6E38', status:'live', website:'https://excellenceds.ae', phone:'+971 600 515 154' },
    { name:'Al Ahli Driving Center', code:'AA', emirate:'Dubai', location:'Dubai — Al Quoz, Al Nahda (10+ branches)', priceFrom:3100, rating:4.4, reviews:'1,400+', tags:['Car','Motorcycle','Bus'], color:'#5A4020', status:'live' },
    // ── ABU DHABI ──────────────────────────────────────────────────
    { name:'Abu Dhabi Driving Center', code:'A', emirate:'Abu Dhabi', location:'Abu Dhabi — Main branch & 5 centres', priceFrom:4000, rating:4.4, reviews:'1,200+', tags:['Car','Heavy Truck','Bus'], color:'#5A4020', status:'live', featured:true, website:'https://www.addc.ae' },
    { name:'Emirates Driving Company', code:'ED', emirate:'Abu Dhabi', location:'Abu Dhabi — Musaffah & Khalifa City', priceFrom:3800, rating:4.3, reviews:'800+', tags:['Car','Motorcycle'], color:'#7A5230', status:'live' },
    // ── SHARJAH ────────────────────────────────────────────────────
    { name:'Sharjah Driving Institute', code:'SD', emirate:'Sharjah', location:'Sharjah — Main campus', priceFrom:3500, rating:4.2, reviews:'600+', tags:['Car','Motorcycle','Truck'], color:'#9B6E38', status:'live' },
    // ── AJMAN ─────────────────────────────────────────────────────
    { name:'Ajman Driving Center', code:'AJ', emirate:'Ajman', location:'Ajman — Central', priceFrom:3200, rating:4.1, reviews:'400+', tags:['Car','Motorcycle'], color:'#B8844A', status:'live' },
    // ── RAS AL KHAIMAH ─────────────────────────────────────────────
    { name:'RAK Driving School', code:'RK', emirate:'Ras Al Khaimah', location:'Ras Al Khaimah — City centre', priceFrom:3000, rating:4.0, reviews:'300+', tags:['Car'], color:'#C4673A', status:'live' },
    // ── FUJAIRAH ───────────────────────────────────────────────────
    { name:'Fujairah Driving School', code:'FJ', emirate:'Fujairah', location:'Fujairah — Corniche', priceFrom:2900, rating:4.0, reviews:'250+', tags:['Car','Motorcycle'], color:'#4A3728', status:'live' },
  ];
  await School.insertMany(schools);
};
